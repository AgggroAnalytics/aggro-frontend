<script setup lang="ts">
import { scaleLinear } from 'd3-scale';
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  observed: Array<{ date: string; value: number }>;
  predicted: Array<{ date: string; value: number }>;
}>();

const w = 300;
const h = 120;
const pad = { t: 12, r: 10, b: 22, l: 44 };

function formatNum(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) return n.toFixed(0);
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  return n.toFixed(2);
}

const sortedDates = computed(() => {
  const s = new Set<string>();
  for (const p of props.observed) s.add(p.date);
  for (const p of props.predicted) s.add(p.date);
  return Array.from(s).sort((a, b) => a.localeCompare(b));
});

const hasData = computed(() => props.observed.length > 0 || props.predicted.length > 0);

const yExtent = computed(() => {
  const vals: number[] = [];
  for (const p of props.observed) vals.push(p.value);
  for (const p of props.predicted) vals.push(p.value);
  if (!vals.length) return { min: 0, max: 1 };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (min === max) return { min: min - 1, max: max + 1 };
  const padY = (max - min) * 0.08;
  return { min: min - padY, max: max + padY };
});

const xScale = computed(() => {
  const n = sortedDates.value.length;
  const innerW = w - pad.l - pad.r;
  if (n <= 1) {
    return scaleLinear().domain([0, 1]).range([pad.l, pad.l + innerW]);
  }
  return scaleLinear().domain([0, n - 1]).range([pad.l, pad.l + innerW]);
});

const yScale = computed(() => {
  const innerH = h - pad.t - pad.b;
  const { min, max } = yExtent.value;
  return scaleLinear().domain([min, max]).range([pad.t + innerH, pad.t]);
});

function pathFor(points: Array<{ date: string; value: number }>): string {
  const dates = sortedDates.value;
  if (!dates.length) return '';
  const xs = xScale.value;
  const ys = yScale.value;
  const byDate = new Map(points.map((p) => [p.date, p.value]));
  const parts: string[] = [];
  let started = false;
  for (let i = 0; i < dates.length; i += 1) {
    const v = byDate.get(dates[i]);
    if (v === undefined) {
      started = false;
      continue;
    }
    const x = xs(i);
    const y = ys(v);
    parts.push(`${started ? 'L' : 'M'} ${x} ${y}`);
    started = true;
  }
  return parts.join(' ');
}

const pathObserved = computed(() => pathFor(props.observed));
const pathPredicted = computed(() => pathFor(props.predicted));

const dateLabelStart = computed(() => sortedDates.value[0] ?? '');
const dateLabelEnd = computed(() => {
  const d = sortedDates.value;
  return d.length > 1 ? d[d.length - 1]! : '';
});

const yTopLabel = computed(() => formatNum(yExtent.value.max));
const yBottomLabel = computed(() => formatNum(yExtent.value.min));

const predictedIsConstant = computed(() => {
  const p = props.predicted;
  if (p.length < 2) return false;
  const v0 = p[0]!.value;
  return p.every((x) => Math.abs(x.value - v0) < 1e-9);
});

const forecastExplanation = computed(() => {
  if (!predictedIsConstant.value || props.predicted.length < 2) return '';
  const v = props.predicted[0]!.value;
  return `Среднее по полю ${formatNum(v)} повторяется на каждую дату: в одном прогоне workflow ML даёт один набор оценок на тайл, без привязки к конкретной дате ряда.`;
});
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
    <p class="mb-1 truncate text-xs font-medium text-slate-800" :title="title">{{ title }}</p>
    <div v-if="!hasData" class="flex h-[120px] items-center justify-center text-xs text-slate-400">
      Нет данных
    </div>
    <svg v-else :viewBox="`0 0 ${w} ${h}`" class="w-full max-w-full" preserveAspectRatio="xMidYMid meet">
      <g class="text-[9px] fill-slate-500" aria-hidden="true">
        <text :x="4" :y="pad.t + 2" text-anchor="start">{{ yTopLabel }}</text>
        <text :x="4" :y="h - pad.b - 2" text-anchor="start">{{ yBottomLabel }}</text>
        <text :x="pad.l" :y="h - 6" text-anchor="start">{{ dateLabelStart }}</text>
        <text v-if="dateLabelEnd" :x="w - pad.r" :y="h - 6" text-anchor="end">{{ dateLabelEnd }}</text>
      </g>
      <path
        v-if="pathPredicted"
        :d="pathPredicted"
        fill="none"
        stroke="#ea580c"
        stroke-width="1.5"
        stroke-dasharray="4 3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        v-if="pathObserved"
        :d="pathObserved"
        fill="none"
        stroke="#2563eb"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <div v-if="hasData" class="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-500">
      <span v-if="observed.length" class="inline-flex items-center gap-1">
        <span class="inline-block size-2 rounded-full bg-blue-600" /> наблюдаемое
      </span>
      <span v-if="predicted.length" class="inline-flex items-center gap-1">
        <span class="inline-block h-0.5 w-4 border-t-2 border-dashed border-orange-600" /> прогноз
      </span>
    </div>
    <p v-if="forecastExplanation" class="mt-1 text-[10px] leading-snug text-slate-500">
      {{ forecastExplanation }}
    </p>
  </div>
</template>
