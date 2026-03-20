<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import * as d3 from "d3";

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
  (e: "update:modelValue", value: Date): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);
const isDragging = ref(false);
const dragCandidate = ref(false);
const dragStartX = ref(0);
const dragStartScrollLeft = ref(0);
const hasInitialScroll = ref(false);

const sortedDates = computed(() =>
  [...props.dates]
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime())
);

function sameDate(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getTime() === b.getTime();
}

function formatDate(d: Date) {
  return d3.timeFormat("%Y-%m-%d")(d);
}

function draw() {
  if (!svgRef.value || !sortedDates.value.length) return;

  const step = 120;
  const containerWidth = containerRef.value?.clientWidth ?? props.width;
  const width = Math.max(containerWidth, sortedDates.value.length * step);
  const height = props.height;
  const margin = { left: 24, right: 24 };
  const y = height / 2;

  const svg = d3.select(svgRef.value);
  svg.attr("width", width);
  svg.selectAll("*").remove();

  const x = d3
    .scalePoint<number>()
    .domain(sortedDates.value.map((_, index) => index))
    .range([margin.left, width - margin.right])
    .padding(0.5);

  svg
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", y)
    .attr("y2", y)
    .attr("stroke", "#cbd5e1")
    .attr("stroke-width", 2);

  const points = svg
    .selectAll<SVGGElement, Date>("g.point")
    .data(sortedDates.value, (d: any) => d.getTime())
    .join("g")
    .attr("class", "point")
    .attr("transform", (_d, index) => `translate(${x(index)}, ${y})`)
    .style("cursor", "pointer")
    .on("click", (_, d) => emit("update:modelValue", d));

  points
    .append("circle")
    .attr("r", (d) => (sameDate(d, props.modelValue) ? 7 : 5))
    .attr("fill", (d) => (sameDate(d, props.modelValue) ? "#2563eb" : "#94a3b8"));

  points
    .append("text")
    .text((d) => formatDate(d))
    .attr("text-anchor", "middle")
    .attr("y", -12)
    .attr("font-size", 12)
    .attr("fill", (d) => (sameDate(d, props.modelValue) ? "#2563eb" : "#475569"));

  if (containerRef.value && !hasInitialScroll.value) {
    containerRef.value.scrollLeft = containerRef.value.scrollWidth;
    hasInitialScroll.value = true;
  }
}

function onPointerDown(event: PointerEvent) {
  if (!containerRef.value) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest(".point")) {
    return;
  }
  dragCandidate.value = true;
  isDragging.value = false;
  dragStartX.value = event.clientX;
  dragStartScrollLeft.value = containerRef.value.scrollLeft;
  containerRef.value.setPointerCapture(event.pointerId);
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
  containerRef.value.releasePointerCapture(event.pointerId);
}

onMounted(draw);
watch(() => props.dates, () => {
  hasInitialScroll.value = false;
}, { deep: true });
watch(() => [props.dates, props.modelValue, props.width, props.height], draw, { deep: true });
</script>

<template>
  <div
    ref="containerRef"
    class="no-scrollbar w-full overflow-x-auto overflow-y-hidden select-none cursor-grab active:cursor-grabbing"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <svg ref="svgRef" :height="height" />
  </div>
</template>

<style scoped>
.no-scrollbar {
  scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
