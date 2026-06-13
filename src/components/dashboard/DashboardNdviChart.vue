<template>
  <div v-if="clean.length" class="w-full">
    <svg
      class="h-36 w-full text-emerald-600"
      :viewBox="`0 0 ${vbW} ${vbH}`"
      preserveAspectRatio="none"
      role="img"
      :aria-label="ariaLabel"
    >
      <defs>
        <linearGradient id="ndviFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="rgb(16 185 129)" stop-opacity="0.35" />
          <stop offset="100%" stop-color="rgb(16 185 129)" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="#f8fafc" rx="4" />
      <polygon :points="fillPoints" fill="url(#ndviFill)" />
      <polyline
        :points="linePoints"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
      <g v-for="(p, i) in labeledPoints" :key="i">
        <circle :cx="p.x" :cy="p.y" r="3" fill="currentColor" class="text-emerald-700" />
      </g>
    </svg>
    <div class="mt-1 flex justify-between text-[10px] text-slate-500">
      <span>{{ labelStart }}</span>
      <span>{{ labelEnd }}</span>
    </div>
  </div>
  <p v-else class="text-sm text-slate-500">Нет недельных точек NDVI (наблюдаемая аналитика) за последние 8 недель.</p>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  points: Array<{ week_start?: string; ndvi_mean_avg?: number }>;
}>();

const vbW = 320;
const vbH = 120;
const pad = 10;

const clean = computed(() =>
  props.points.filter((p) => p.ndvi_mean_avg != null && !Number.isNaN(Number(p.ndvi_mean_avg))),
);

const vals = computed(() => clean.value.map((p) => Number(p.ndvi_mean_avg)));

const ariaLabel = computed(() => `NDVI по неделям, ${clean.value.length} точек`);

const labelStart = computed(() => {
  const s = clean.value[0]?.week_start;
  if (!s) return '';
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(s));
  } catch {
    return '';
  }
});

const labelEnd = computed(() => {
  const s = clean.value[clean.value.length - 1]?.week_start;
  if (!s) return '';
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(s));
  } catch {
    return '';
  }
});

const labeledPoints = computed(() => {
  const ys = vals.value;
  if (!ys.length) return [];
  let min = Math.min(...ys, 0);
  let max = Math.max(...ys, 0.2);
  if (max - min < 0.05) {
    max = min + 0.15;
  }
  const n = ys.length;
  const innerW = vbW - pad * 2;
  const innerH = vbH - pad * 2;
  return ys.map((y, i) => {
    const x = pad + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const t = (y - min) / (max - min || 1);
    const py = pad + innerH * (1 - t);
    return { x, y: py };
  });
});

const linePoints = computed(() => labeledPoints.value.map((p) => `${p.x},${p.y}`).join(' '));

const fillPoints = computed(() => {
  const pts = labeledPoints.value;
  if (!pts.length) return '';
  const baseY = vbH - pad;
  const top = pts.map((p) => `${p.x},${p.y}`).join(' ');
  return `${pts[0].x},${baseY} ${top} ${pts[pts.length - 1].x},${baseY}`;
});
</script>
