<script setup lang="ts">
import { useEventListener, useResizeObserver } from '@vueuse/core';
import * as d3 from 'd3';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

type Props = {
  dates: Date[];
  modelValue: Date | null;
  width?: number;
  height?: number;
};

const props = withDefaults(defineProps<Props>(), {
  width: 600,
  height: 72,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date): void;
}>();

const STEP = 120;

const containerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);
const isDragging = ref(false);
const dragCandidate = ref(false);
const dragStartX = ref(0);
const dragStartScrollLeft = ref(0);

const sortedDates = computed(() =>
  [...props.dates]
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime()),
);

function sameDate(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getTime() === b.getTime();
}

function formatDate(d: Date) {
  return d3.timeFormat('%Y-%m-%d')(d);
}

type Layout = {
  width: number;
  height: number;
  margin: { left: number; right: number };
  y: number;
  x: d3.ScalePoint<number>;
};

function computeLayout(): Layout | null {
  if (!sortedDates.value.length) return null;
  const containerWidth = containerRef.value?.clientWidth ?? props.width;
  const width = Math.max(containerWidth, sortedDates.value.length * STEP);
  const height = props.height;
  const margin = { left: 24, right: 24 };
  const y = height / 2;
  const x = d3
    .scalePoint<number>()
    .domain(sortedDates.value.map((_, index) => index))
    .range([margin.left, width - margin.right])
    .padding(0.5);
  return { width, height, margin, y, x };
}

function scrollSelectedIntoView(layout: Layout) {
  const el = containerRef.value;
  if (!el) return;
  const idx = sortedDates.value.findIndex((d) => sameDate(d, props.modelValue));
  const cw = el.clientWidth;
  const maxScroll = Math.max(0, el.scrollWidth - cw);

  if (idx < 0) {
    el.scrollLeft = maxScroll;
    return;
  }
  const px = layout.x(idx);
  if (px === undefined) return;
  el.scrollLeft = Math.max(0, Math.min(maxScroll, px - cw / 2));
}

function draw() {
  if (!svgRef.value || !sortedDates.value.length) return;

  const layout = computeLayout();
  if (!layout) return;

  const { width, height, margin, y, x } = layout;
  const svg = d3.select(svgRef.value);
  svg.attr('width', width);
  svg.attr('height', height);
  svg.style('display', 'block');
  svg.selectAll('*').remove();

  svg
    .append('line')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right)
    .attr('y1', y)
    .attr('y2', y)
    .attr('stroke', '#cbd5e1')
    .attr('stroke-width', 2);

  const points = svg
    .selectAll<SVGGElement, Date>('g.point')
    .data(sortedDates.value, (d: Date) => String(d.getTime()))
    .join('g')
    .attr('class', 'point')
    .attr('transform', (_d, index) => `translate(${x(index)}, ${y})`)
    .style('cursor', 'pointer')
    .on('click', (_, d) => emit('update:modelValue', d));

  points
    .append('circle')
    .attr('r', (d) => (sameDate(d, props.modelValue) ? 7 : 5))
    .attr('fill', (d) => (sameDate(d, props.modelValue) ? '#2563eb' : '#94a3b8'));

  points
    .append('text')
    .text((d) => formatDate(d))
    .attr('text-anchor', 'middle')
    .attr('y', -12)
    .attr('font-size', 12)
    .attr('fill', (d) => (sameDate(d, props.modelValue) ? '#2563eb' : '#475569'));

  void nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const L = computeLayout();
        if (L) scrollSelectedIntoView(L);
      });
    });
  });
}

function onPointerDown(event: PointerEvent) {
  if (!containerRef.value) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('.point')) {
    return;
  }
  dragCandidate.value = true;
  isDragging.value = false;
  dragStartX.value = event.clientX;
  dragStartScrollLeft.value = containerRef.value.scrollLeft;
  try {
    containerRef.value.setPointerCapture(event.pointerId);
  } catch {
    /* ignore */
  }
}

function onPointerMove(event: PointerEvent) {
  if (!dragCandidate.value || !containerRef.value) return;
  const delta = event.clientX - dragStartX.value;
  if (!isDragging.value && Math.abs(delta) > 3) {
    isDragging.value = true;
  }
  if (!isDragging.value) return;
  containerRef.value.scrollLeft = dragStartScrollLeft.value - delta;
}

function onPointerUp(event: PointerEvent) {
  if (!containerRef.value) return;
  dragCandidate.value = false;
  isDragging.value = false;
  try {
    containerRef.value.releasePointerCapture(event.pointerId);
  } catch {
    /* ignore */
  }
}

/** Вертикальное колесо → горизонтальная прокрутка; горизонтальный жест не трогаем. */
useEventListener(
  containerRef,
  'wheel',
  (e: WheelEvent) => {
    const el = containerRef.value;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;

    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      return;
    }
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  },
  { passive: false },
);

watch(
  () => [props.dates, props.modelValue, props.width, props.height] as const,
  () => {
    void nextTick(draw);
  },
  { deep: true },
);

watch(
  () => containerRef.value,
  (el) => {
    if (el) void nextTick(draw);
  },
);

onMounted(() => {
  void nextTick(draw);
});

useResizeObserver(containerRef, () => {
  void nextTick(draw);
});

onBeforeUnmount(() => {
  containerRef.value = null;
});
</script>

<template>
  <div class="w-full min-w-0 max-w-full">
    <div
      ref="containerRef"
      class="timeline-scroll no-scrollbar w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden select-none"
      :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
      style="touch-action: pan-x pinch-zoom"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- Обёртка задаёт ширину контента; без неё scrollWidth у flex/absolute предков часто совпадает с clientWidth -->
      <div class="inline-block w-max min-w-max">
        <svg ref="svgRef" :height="height" width="0" class="block max-w-none" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgb(148 163 184 / 0.6) transparent;
}

.no-scrollbar::-webkit-scrollbar {
  display: block;
  height: 8px;
}

.no-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgb(148 163 184 / 0.55);
  border-radius: 9999px;
}

.timeline-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}
</style>
