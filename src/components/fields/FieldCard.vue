<template>
  <article
    class="rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-emerald-50/40 p-3 shadow-sm ring-1 ring-slate-900/5 transition hover:border-emerald-200/80 hover:shadow-md"
  >
    <div class="flex gap-3">
      <canvas
        ref="_canvasRef"
        class="mt-0.5 shrink-0 rounded-lg border border-slate-200/80 bg-white shadow-inner"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <h3 class="truncate text-base font-semibold leading-tight text-slate-900">
            {{ field.name }}
          </h3>
          <p
            v-if="field.description?.trim()"
            class="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-600"
          >
            {{ field.description }}
          </p>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <span
            class="inline-flex items-center gap-1 rounded-md bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium text-slate-700"
            title="Рабочих тайлов (сегментов поля)"
          >
            <Layers class="size-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
            {{ tilesLabel }}
          </span>
          <span
            class="inline-flex items-center gap-1 rounded-md bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium text-slate-700"
            title="Сезонов"
          >
            <CalendarRange class="size-3.5 shrink-0 text-sky-700" aria-hidden="true" />
            {{ seasonsLabel }}
          </span>
          <span
            class="inline-flex items-center gap-1 rounded-md bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium text-slate-700"
            title="Дат с агрегированной аналитикой (наблюдаемые)"
          >
            <LineChart class="size-3.5 shrink-0 text-violet-700" aria-hidden="true" />
            {{ analyticsLabel }}
          </span>
          <span
            v-if="pmtilesCount > 0"
            class="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900 ring-1 ring-amber-200/80"
            title="Готовых векторных слоёв (PMTiles)"
          >
            <Map class="size-3.5 shrink-0" aria-hidden="true" />
            {{ pmtilesCount }} слоёв
          </span>
        </div>

        <p class="flex items-start gap-1.5 text-xs text-slate-600">
          <Clock class="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>
            <span class="text-slate-500">Последние данные:</span>
            {{ latestObservationLabel }}
          </span>
        </p>

        <p class="text-[11px] text-slate-400">
          Создано {{ formattedDate }}
          <span v-if="areaLabel"> · {{ areaLabel }}</span>
        </p>

        <div class="flex flex-wrap gap-1.5 pt-0.5">
          <Button variant="outline" size="sm" class="h-8" title="Показать на карте" @click="emit('fitTo')">
            <MapPin class="size-4" />
            <span class="sr-only sm:not-sr-only sm:ml-1 sm:text-xs">На карте</span>
          </Button>
          <Button variant="default" size="sm" class="h-8 bg-emerald-700 hover:bg-emerald-800" title="Открыть поле" @click="emit('enter')">
            <SquareArrowRightEnter class="size-4" />
            <span class="sr-only sm:not-sr-only sm:ml-1 sm:text-xs">Открыть</span>
          </Button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { FieldListItem } from '@/api';
import { useGeoPolygonCanvas } from '@/composables/useGeoPolygonCanvas';
import { computed } from 'vue';
import Button from '../ui/button/Button.vue';
import {
  CalendarRange,
  Clock,
  Layers,
  LineChart,
  Map,
  MapPin,
  SquareArrowRightEnter,
} from 'lucide-vue-next';

const lang = navigator.language;

const dateFormatter = new Intl.DateTimeFormat(lang, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const props = defineProps<{
  field: FieldListItem;
}>();

const polygon = computed(() => {
  return (props.field.coordinates ?? []) as [number, number][][];
});

const formattedDate = computed(() => {
  if (!props.field.created_at) return '—';
  return dateFormatter.format(new Date(props.field.created_at));
});

const areaLabel = computed(() => {
  const ha = props.field.area_hectares;
  if (ha == null || Number.isNaN(ha)) return '';
  return `${ha.toFixed(2)} га`;
});

const tilesCount = computed(() => props.field.tile_count ?? 0);
const seasonsCount = computed(() => props.field.season_count ?? 0);
const analyticsDates = computed(() => props.field.observed_analytics_dates ?? 0);
const pmtilesCount = computed(() => props.field.pmtiles_layer_count ?? 0);

const tilesLabel = computed(() => {
  const n = tilesCount.value;
  return n === 1 ? '1 тайл' : `${n} тайлов`;
});

const seasonsLabel = computed(() => {
  const n = seasonsCount.value;
  if (n === 0) return 'нет сезонов';
  if (n === 1) return '1 сезон';
  if (n >= 2 && n <= 4) return `${n} сезона`;
  return `${n} сезонов`;
});

const analyticsLabel = computed(() => {
  const n = analyticsDates.value;
  if (n === 0) return 'нет аналитики';
  if (n === 1) return '1 дата';
  if (n >= 2 && n <= 4) return `${n} даты`;
  return `${n} дат`;
});

function formatRelativePast(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const now = Date.now();
  const diffSec = Math.round((then - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHr = Math.round(diffSec / 3600);
  if (Math.abs(diffHr) < 48) return rtf.format(diffHr, 'hour');
  const diffDay = Math.round(diffSec / 86400);
  if (Math.abs(diffDay) < 14) return rtf.format(diffDay, 'day');
  const diffWeek = Math.round(diffSec / 604800);
  if (Math.abs(diffWeek) < 8) return rtf.format(diffWeek, 'week');
  const diffMonth = Math.round(diffSec / (30.44 * 86400));
  if (Math.abs(diffMonth) < 24) return rtf.format(diffMonth, 'month');
  const diffYear = Math.round(diffSec / (365.25 * 86400));
  return rtf.format(diffYear, 'year');
}

const latestObservationLabel = computed(() => {
  const iso = props.field.latest_observation_at;
  if (!iso) {
    if (tilesCount.value === 0) {
      return 'сначала нарежьте поле и запустите обработку';
    }
    return 'ожидаются спутниковые ряды';
  }
  return formatRelativePast(iso);
});

const { canvasRef: _canvasRef } = useGeoPolygonCanvas(polygon, {
  width: 88,
  height: 88,
  padding: 7,
  fillStyle: 'rgba(16, 185, 129, 0.28)',
  strokeStyle: '#047857',
  lineWidth: 1.5,
  backgroundColor: '#f8fafc',
});

const emit = defineEmits(['fitTo', 'enter']);
</script>
