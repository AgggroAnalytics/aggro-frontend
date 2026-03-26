<script setup lang="ts">
import { buildMapLegend, loadPmtilesMetadataForLegend, type MapLegend } from '@/composables/usePmtilesRenderer';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  pmtilesUrl: string | null;
  metricField: string;
}>();

const legend = ref<MapLegend | null>(null);
const loading = ref(false);

function formatAxis(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
  if (Math.abs(n - Math.round(n)) < 1e-6) return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
}

const gradientMidLabel = computed(() => {
  if (!legend.value || legend.value.mode !== 'gradient') return '';
  const { min, max } = legend.value;
  const mid = min + (max - min) * 0.33;
  return formatAxis(mid);
});

async function load() {
  legend.value = null;
  if (!props.pmtilesUrl || !props.metricField) return;
  loading.value = true;
  try {
    const loaded = await loadPmtilesMetadataForLegend(props.pmtilesUrl);
    if (!loaded) return;
    legend.value = buildMapLegend(props.metricField, loaded.metadata, loaded.sourceLayer);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.pmtilesUrl, props.metricField] as const,
  () => {
    void load();
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="pmtilesUrl && metricField" class="border-t border-slate-100 pt-2">
    <p class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">Легенда</p>
    <div v-if="loading" class="h-6 animate-pulse rounded bg-slate-100" />
    <template v-else-if="legend?.mode === 'categorical'">
      <div class="flex flex-wrap items-stretch gap-x-3 gap-y-1">
        <div
          v-for="(item, i) in legend.items"
          :key="i"
          class="flex min-w-0 max-w-[9rem] items-center gap-1.5 text-[11px] text-slate-700"
        >
          <span
            class="size-3 shrink-0 rounded-sm border border-slate-200/80 shadow-sm"
            :style="{ backgroundColor: item.color }"
          />
          <span class="truncate leading-tight" :title="item.label">{{ item.label }}</span>
        </div>
      </div>
    </template>
    <template v-else-if="legend?.mode === 'gradient'">
      <div class="space-y-1">
        <div
          class="h-2.5 w-full rounded-full border border-slate-200/80 shadow-inner"
          :style="{ background: legend.gradientCss }"
        />
        <div class="flex justify-between gap-2 text-[10px] text-slate-600">
          <span class="min-w-0 truncate" :title="formatAxis(legend.min)">{{ formatAxis(legend.min) }}</span>
          <span class="shrink-0 text-slate-400">{{ gradientMidLabel }}</span>
          <span class="min-w-0 truncate text-right" :title="formatAxis(legend.max)">{{ formatAxis(legend.max) }}</span>
        </div>
        <p class="text-[10px] text-slate-400">Градиент по min–max в текущем слое</p>
      </div>
    </template>
  </div>
</template>
