<template>
  <div v-if="currentField" class="space-y-5">
    <section class="rounded-xl border bg-white/90 shadow-sm">
      <div class="flex gap-2 p-4">
        <button
          type="button"
          class="mt-0.5 shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100"
          :aria-expanded="sectionOpen.overview"
          aria-label="Свернуть или развернуть карточку поля"
          @click="sectionOpen.overview = !sectionOpen.overview"
        >
          <ChevronDown
            class="size-5 transition-transform duration-200"
            :class="sectionOpen.overview ? '' : '-rotate-90'"
          />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-1">
              <h1 class="text-xl font-semibold text-slate-900">{{ currentField.name }}</h1>
              <p v-show="sectionOpen.overview" class="text-sm text-slate-600">Текущий сезон: {{ seasonTitle }}</p>
            </div>
            <Button variant="outline" size="sm" @click="fitTo(currentField.id!)">Центрировать</Button>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-xl border bg-white/90 shadow-sm">
      <button
        type="button"
        class="flex w-full items-center gap-2 p-4 text-left hover:bg-slate-50/90"
        :aria-expanded="sectionOpen.processing"
        aria-label="Свернуть или развернуть блок обработки"
        @click="sectionOpen.processing = !sectionOpen.processing"
      >
        <ChevronDown
          class="size-5 shrink-0 text-slate-500 transition-transform duration-200"
          :class="sectionOpen.processing ? '' : '-rotate-90'"
        />
        <h2 class="text-lg font-semibold text-slate-900">Обработка и покрытие дат</h2>
      </button>
      <div v-show="sectionOpen.processing" class="space-y-5 border-t border-slate-100 px-4 pb-4 pt-3">
      <div class="mb-3 flex items-end gap-2">
        <div class="w-44">
          <p class="mb-1 text-sm font-medium text-slate-800">Год</p>
          <Select :model-value="String(selectedYear)" @update:model-value="onYearChange">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Выберите год" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="year in yearOptions" :key="year" :value="String(year)">
                {{ year }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button :disabled="pendingDates.length === 0 || startProcessingMutation.isPending.value" @click="startWorkflowForYear">
          Запустить workflow
        </Button>
      </div>
      <div class="rounded-lg border bg-slate-50 p-3">
        <div class="mb-2 flex items-center justify-between text-sm">
          <span class="font-medium text-slate-800">Покрытие дат за {{ selectedYear }}</span>
          <span class="text-slate-600">{{ processedDatesCount }}/{{ totalDatesCount }} ({{ coveragePercent }}%)</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded bg-slate-200">
          <div class="h-full bg-emerald-500 transition-all" :style="{ width: `${coveragePercent}%` }" />
        </div>
        <div class="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div v-for="month in monthlyCoverage" :key="month.month" class="rounded border bg-white px-2 py-1">
            <div class="font-medium text-slate-700">{{ month.label }}</div>
            <div class="text-slate-500">{{ month.processed }}/{{ month.total }}</div>
          </div>
        </div>
      </div>
      <div class="mt-3 rounded-lg border bg-slate-50 p-3">
        <p class="mb-1 text-sm font-medium text-slate-800">Удалить результаты за обработанные даты</p>
        <div class="max-h-32 overflow-y-auto rounded-md border bg-white p-2">
          <div v-if="processedDates.length" class="flex flex-wrap gap-2">
            <button
              v-for="date in processedDates"
              :key="date"
              type="button"
              class="rounded-md border px-2 py-1 text-xs transition-colors"
              :class="selectedDatesToDelete.includes(date) ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
              @click="toggleDateToDelete(date)"
            >
              {{ date }}
            </button>
          </div>
          <p v-else class="text-xs text-slate-500">Нет обработанных дат для удаления</p>
        </div>
        <div class="mt-2">
          <Button
            variant="outline"
            :disabled="!selectedDatesToDelete.length || deleteResultsMutation.isPending.value"
            @click="deleteResultsMutation.mutate()"
          >
            Удалить выбранные результаты
          </Button>
        </div>
      </div>
      <p v-if="launchError" class="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-sm text-red-700">
        {{ launchError }}
      </p>
      </div>
    </section>

    <section class="rounded-xl border bg-white/90 shadow-sm">
      <button
        type="button"
        class="flex w-full items-center gap-2 p-4 text-left hover:bg-slate-50/90"
        :aria-expanded="sectionOpen.charts"
        aria-label="Свернуть или развернуть графики"
        @click="sectionOpen.charts = !sectionOpen.charts"
      >
        <ChevronDown
          class="size-5 shrink-0 text-slate-500 transition-transform duration-200"
          :class="sectionOpen.charts ? '' : '-rotate-90'"
        />
        <h2 class="text-lg font-semibold text-slate-900">Графики метрик за {{ selectedYear }}</h2>
      </button>
      <div v-show="sectionOpen.charts" class="border-t border-slate-100 px-4 pb-4 pt-3">
      <p class="mb-3 text-xs text-slate-600">
        Синяя линия — агрегаты по тайлам в БД для наблюдаемых дат. Оранжевая пунктир — средние ML-метрик по тайлам, записанные финализатором workflow в строки аналитики с источником «predicted».
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <MetricSparkline
          v-for="m in metricCatalog"
          :key="m.key"
          :title="m.label"
          :observed="observedChartByMetric[m.key] ?? []"
          :predicted="predictedChartByMetric[m.key] ?? []"
        />
      </div>
      </div>
    </section>

    <section class="rounded-xl border bg-white/90 shadow-sm">
      <button
        type="button"
        class="flex w-full items-center gap-2 p-4 text-left hover:bg-slate-50/90"
        :aria-expanded="sectionOpen.history"
        aria-label="Свернуть или развернуть историю workflow"
        @click="sectionOpen.history = !sectionOpen.history"
      >
        <ChevronDown
          class="size-5 shrink-0 text-slate-500 transition-transform duration-200"
          :class="sectionOpen.history ? '' : '-rotate-90'"
        />
        <h2 class="text-lg font-semibold text-slate-900">История workflow</h2>
      </button>
      <div v-show="sectionOpen.history" class="border-t border-slate-100 px-4 pb-4 pt-3">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[740px] text-sm">
          <thead>
            <tr class="border-b text-left text-slate-600">
              <th class="pb-2">Запуск</th>
              <th class="pb-2">Статус</th>
              <th class="pb-2">Период</th>
              <th class="pb-2">Прогресс</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="run in workflowRuns" :key="run.run_id" class="border-b align-top">
              <td class="py-3 font-mono text-xs">{{ run.run_id }}</td>
              <td class="py-3">{{ statusLabel(run.status) }}</td>
              <td class="py-3 text-xs text-slate-600">
                {{ run.started_at ? new Date(run.started_at).toLocaleString() : '—' }}
              </td>
              <td class="py-3">
                <StepperRoot :model-value="runStep(run)" linear class="grid gap-1">
                  <StepperItem
                    v-for="step in workflowSteps"
                    :key="`${run.run_id}-${step.number}`"
                    :step="step.number"
                    :completed="runStep(run) > step.number"
                    as="div"
                  >
                    <div class="flex items-center gap-2">
                      <StepperTrigger
                        class="flex size-5 items-center justify-center rounded-full border text-[10px]"
                        :class="runStep(run) >= step.number ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-slate-500'"
                      >
                        {{ step.number }}
                      </StepperTrigger>
                      <StepperTitle class="text-xs text-slate-700">{{ step.title }}</StepperTitle>
                    </div>
                  </StepperItem>
                </StepperRoot>
              </td>
            </tr>
            <tr v-if="!workflowRuns.length">
              <td colspan="4" class="py-4 text-sm text-slate-500">Пока нет запусков workflow</td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </section>

    <Teleport to="#map-overlay-root">
      <div class="pointer-events-auto w-[calc(100%-8px)] space-y-2 rounded-xl border bg-white/95 p-3 shadow-lg">
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-slate-600">Метрика:</span>
          <Select :model-value="selectedMetric" @update:model-value="onMetricChange">
            <SelectTrigger class="h-8 w-56">
              <SelectValue placeholder="Выберите метрику" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup v-for="group in groupedMetrics" :key="group.title">
                <SelectLabel>{{ group.title }}</SelectLabel>
                <SelectItem v-for="metric in group.metrics" :key="metric" :value="metric">
                  {{ metricLabel(metric) }}
                </SelectItem>
                <SelectSeparator />
              </SelectGroup>
            </SelectContent>
          </Select>
          <span class="text-xs text-slate-500">Дата: {{ selectedTimelineDate ?? '—' }}</span>
        </div>
        <TimelinePicker :dates="timelineDates" :model-value="timelineModelDate" :height="72" @update:model-value="onTimelineChange" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { getFieldsById, getFieldsByIdAnalytics, getFieldsByIdWorkflows, type FieldAnalyticsRow, type FieldWorkflowRun } from '@/api';
import { client } from '@/api/client.gen';
import { useMapPolygons } from '@/composables/useMapPolygons';
import { usePmtilesRenderer } from '@/composables/usePmtilesRenderer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { ChevronDown } from 'lucide-vue-next';
import { computed, inject, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  StepperItem,
  StepperRoot,
  StepperTitle,
  StepperTrigger,
} from 'reka-ui';
import { mapKey } from '../layout/map.inject';
import Button from '../ui/button/Button.vue';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import MetricSparkline from './MetricSparkline.vue';
import TimelinePicker from './TimelinePicker.vue';

type WorkflowStep = {
  number: number;
  title: string;
  description: string;
  stageKeys: string[];
}

const workflowSteps: WorkflowStep[] = [
  { number: 1, title: 'Нарезка тайлов', description: 'Геометрия поля разбивается на рабочие сегменты.', stageKeys: ['cut_tiles', 'tiles'] },
  { number: 2, title: 'Geo метрики', description: 'Сбор спутниковых и погодных признаков.', stageKeys: ['geo_metrics', 'gee'] },
  { number: 3, title: 'ML аналитика', description: 'Расчеты моделей по тайлам и временным рядам.', stageKeys: ['ml_analytics', 'ml'] },
  { number: 4, title: 'PMTiles', description: 'Формирование артефактов для визуализации.', stageKeys: ['parallel', 'pmtiles'] },
  { number: 5, title: 'Финализация', description: 'Сохранение агрегатов в базу данных.', stageKeys: ['finalize_db', 'db', 'completed', 'complete'] },
];

const route = useRoute('/fields/[id]');
const queryClient = useQueryClient();

const sectionOpen = reactive({
  overview: true,
  processing: true,
  charts: true,
  history: true,
});

const fieldId = computed(() => route.params.id);

const currentFieldQuery = useQuery({
  queryKey: ['fieldDetailed', fieldId],
  queryFn: ({ queryKey }) => {
    const id = queryKey[1] as string;
    return getFieldsById({ path: { id } });
  },
});

const currentField = computed(() => currentFieldQuery.data.value?.data);
const launchError = ref<string | null>(null);
const selectedTimelineDate = ref<string | null>(null);
const selectedMetric = ref<string>('ndvi');
const selectedYear = ref(new Date().getFullYear());
const selectedDatesToDelete = ref<string[]>([]);
const yearOptions = computed(() => {
  const current = new Date().getFullYear();
  return [current, current - 1];
});

const metricCatalog = [
  { key: 'ndvi', label: 'NDVI', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'ndmi', label: 'NDMI', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'ndre', label: 'NDRE', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'gndvi', label: 'GNDVI', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'msavi', label: 'MSAVI', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'nbr2', label: 'NBR2', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'bare_soil_index', label: 'Индекс оголенной почвы', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'valid_pixel_ratio', label: 'Доля валидных пикселей', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'temperature_c_mean', label: 'Средняя температура, °C', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'precipitation_mm_3d', label: 'Осадки за 3 дня, мм', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'precipitation_mm_7d', label: 'Осадки за 7 дней, мм', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'precipitation_mm_30d', label: 'Осадки за 30 дней, мм', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'degradation_score', label: 'Скор деградации', group: 'Прогноз: деградация' },
  { key: 'health_score', label: 'Скор здоровья', group: 'Прогноз: здоровье/стресс' },
  { key: 'stress_score_total', label: 'Суммарный стресс', group: 'Прогноз: здоровье/стресс' },
  { key: 'water_stress', label: 'Водный стресс', group: 'Прогноз: здоровье/стресс' },
  { key: 'confidence', label: 'Уверенность модели', group: 'Прогноз: полив' },
  { key: 'under_irrigation_risk_score', label: 'Риск недополива', group: 'Прогноз: полив' },
  { key: 'over_irrigation_risk_score', label: 'Риск переполива', group: 'Прогноз: полив' },
  { key: 'uniformity_score', label: 'Равномерность полива', group: 'Прогноз: полив' },
] as const;

const observedAnalyticsColumn: Partial<Record<(typeof metricCatalog)[number]['key'], keyof FieldAnalyticsRow>> = {
  ndvi: 'ndvi_mean',
  ndmi: 'ndmi_mean',
  ndre: 'ndre_mean',
  gndvi: 'gndvi_mean',
  msavi: 'msavi_mean',
  nbr2: 'nbr2_mean',
  bare_soil_index: 'bare_soil_index_mean',
  valid_pixel_ratio: 'valid_pixel_ratio_mean',
  temperature_c_mean: 'temperature_c_mean',
  precipitation_mm_3d: 'precipitation_mm_3d_mean',
  precipitation_mm_7d: 'precipitation_mm_7d_mean',
  precipitation_mm_30d: 'precipitation_mm_30d_mean',
};

const predictedAnalyticsColumn: Partial<Record<(typeof metricCatalog)[number]['key'], keyof FieldAnalyticsRow>> = {
  degradation_score: 'prediction_degradation_score',
  health_score: 'prediction_health_score',
  stress_score_total: 'prediction_stress_score_total',
  water_stress: 'prediction_water_stress',
  confidence: 'prediction_confidence',
  under_irrigation_risk_score: 'prediction_under_irrigation_risk_score',
  over_irrigation_risk_score: 'prediction_over_irrigation_risk_score',
  uniformity_score: 'prediction_uniformity_score',
};

const groupedMetrics = computed(() => {
  const groups = new Map<string, string[]>();
  for (const metric of metricCatalog) {
    if (!groups.has(metric.group)) groups.set(metric.group, []);
    groups.get(metric.group)!.push(metric.key);
  }
  return Array.from(groups.entries()).map(([title, metrics]) => ({ title, metrics }));
});

const workflowsQuery = useQuery({
  queryKey: ['fieldWorkflows', fieldId],
  queryFn: ({ queryKey }) => {
    const id = queryKey[1] as string;
    return getFieldsByIdWorkflows({ path: { id } });
  },
  refetchInterval: (query) => {
    const runs = query.state.data?.data?.runs ?? [];
    const hasRunning = runs.some((run) => isStatusRunning(run.status));
    return hasRunning ? 2500 : false;
  },
});

const processingDatesQuery = useQuery({
  queryKey: ['fieldProcessingDates', fieldId, selectedYear],
  queryFn: ({ queryKey }) => client.get<{
    200: {
      year?: number;
      year_start?: string;
      year_end?: string;
      processing_dates?: Array<{ date: string; processed: boolean }>;
    }
  }, unknown>({
    url: '/fields/{id}/processing-dates',
    path: { id: queryKey[1] as string },
    query: { year: queryKey[2] as number },
    security: [{ scheme: 'bearer', type: 'http' }],
  }),
});

const analyticsQuery = useQuery({
  queryKey: ['fieldAnalytics', fieldId],
  queryFn: ({ queryKey }) => getFieldsByIdAnalytics({ path: { id: queryKey[1] as string } }),
});

const observedChartByMetric = computed(() => {
  const yearPrefix = String(selectedYear.value);
  const rows = analyticsQuery.data.value?.data?.analytics ?? [];
  const out: Record<string, Array<{ date: string; value: number }>> = {};
  for (const item of metricCatalog) {
    const key = item.key;
    out[key] = [];
    const col = observedAnalyticsColumn[key];
    if (!col) continue;
    const pts: Array<{ date: string; value: number }> = [];
    for (const row of rows) {
      if (row.source === 'predicted') continue;
      const od = row.observation_date;
      if (!od || !od.startsWith(yearPrefix)) continue;
      const raw = row[col];
      if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
      pts.push({ date: od.slice(0, 10), value: raw });
    }
    pts.sort((a, b) => a.date.localeCompare(b.date));
    out[key] = pts;
  }
  return out;
});

const predictedChartByMetric = computed(() => {
  const yearPrefix = String(selectedYear.value);
  const rows = analyticsQuery.data.value?.data?.analytics ?? [];
  const predRows = rows.filter(
    (r) => r.source === 'predicted' && r.observation_date?.startsWith(yearPrefix),
  );
  const out: Record<string, Array<{ date: string; value: number }>> = {};
  for (const item of metricCatalog) {
    out[item.key] = [];
  }
  for (const row of predRows) {
    const od = row.observation_date;
    if (!od) continue;
    const date = od.slice(0, 10);
    for (const item of metricCatalog) {
      const key = item.key;
      const col = predictedAnalyticsColumn[key];
      if (!col) continue;
      const raw = row[col];
      if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
      out[key]!.push({ date, value: raw });
    }
  }
  for (const item of metricCatalog) {
    out[item.key]!.sort((a, b) => a.date.localeCompare(b.date));
  }
  return out;
});

const startProcessingMutation = useMutation({
  mutationFn: async () => {
    launchError.value = null;
    return client.post<{
      202?: {
        status?: string;
        field_id?: string;
        workflow_id?: string;
        run_id?: string;
      }
    }, unknown>({
      url: '/fields/{id}/workflows',
      path: { id: fieldId.value! },
      body: {
        year: selectedYear.value,
      },
      security: [{ scheme: 'bearer', type: 'http' }],
    });
  },
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['fieldWorkflows', fieldId] });
    await queryClient.invalidateQueries({ queryKey: ['fieldProcessingDates', fieldId] });
    await queryClient.invalidateQueries({ queryKey: ['fieldAnalytics', fieldId] });
  },
  onError: (error) => {
    launchError.value = error instanceof Error ? error.message : 'Не удалось запустить обработку поля.';
  },
});

const deleteResultsMutation = useMutation({
  mutationFn: async () => client.post<{
    200?: { status?: string; dates?: string[] };
  }, unknown>({
    url: '/fields/{id}/results/delete',
    path: { id: fieldId.value! },
    body: { dates: selectedDatesToDelete.value },
    security: [{ scheme: 'bearer', type: 'http' }],
  }),
  onSuccess: async () => {
    selectedDatesToDelete.value = [];
    await queryClient.invalidateQueries({ queryKey: ['fieldProcessingDates', fieldId, selectedYear] });
    await queryClient.invalidateQueries({ queryKey: ['fieldAnalytics', fieldId] });
  },
  onError: (error) => {
    launchError.value = error instanceof Error ? error.message : 'Не удалось удалить результаты.';
  },
});

const workflowRuns = computed<FieldWorkflowRun[]>(() => workflowsQuery.data.value?.data?.runs ?? []);
const processingDates = computed(() => {
  const dates = processingDatesQuery.data.value?.data?.processing_dates ?? [];
  return dates.map((d) => d.date);
});
const pendingDates = computed(() => {
  const dates = processingDatesQuery.data.value?.data?.processing_dates ?? [];
  return dates.filter((d) => !d.processed).map((d) => d.date);
});
const processedDates = computed(() => {
  const dates = processingDatesQuery.data.value?.data?.processing_dates ?? [];
  return dates.filter((d) => d.processed).map((d) => d.date);
});
const processedDateSet = computed(() => {
  const dates = processingDatesQuery.data.value?.data?.processing_dates ?? [];
  return new Set(dates.filter((d) => d.processed).map((d) => d.date));
});
const totalDatesCount = computed(() => processingDates.value.length);
const processedDatesCount = computed(() => processedDateSet.value.size);
const coveragePercent = computed(() => {
  if (!totalDatesCount.value) return 0;
  return Math.round((processedDatesCount.value / totalDatesCount.value) * 100);
});
const monthlyCoverage = computed(() => {
  const processed = processedDateSet.value;
  const stats: Array<{ month: number; label: string; processed: number; total: number }> = [];
  for (let month = 1; month <= 12; month += 1) {
    const dates = processingDates.value.filter((date) => Number(date.slice(5, 7)) === month);
    stats.push({
      month,
      label: new Date(selectedYear.value, month - 1, 1).toLocaleString('ru-RU', { month: 'short' }),
      processed: dates.filter((date) => processed.has(date)).length,
      total: dates.length,
    });
  }
  return stats;
});
const seasonTitle = computed(() => {
  const payload = processingDatesQuery.data.value?.data;
  if (!payload?.year) return '—';
  return `Год ${payload.year} (${payload.year_start} → ${payload.year_end})`;
});

const polys = computed(() => {
  if (!currentField.value) return [];
  return [{
    id: currentField.value.id ?? '',
    coordinates: currentField.value.coordinates ?? [],
  }];
});

const map = inject(mapKey);
const { fitTo } = useMapPolygons(map!.map, polys);

const timelineDates = computed(() => {
  const processed = processedDateSet.value;
  const analyticDates =
    analyticsQuery.data.value?.data?.analytics?.map((row) => row.observation_date).filter((d): d is string => Boolean(d)) ?? [];
  const artifactDates =
    analyticsQuery.data.value?.data?.pmtiles?.map((row) => row.analysis_date).filter((d): d is string => Boolean(d)) ?? [];
  const merged = Array.from(new Set([...analyticDates, ...artifactDates]));
  return merged
    .filter((date) => processed.has(date))
    .map((date) => new Date(`${date}T00:00:00Z`));
});
const timelineModelDate = computed(() => selectedTimelineDate.value ? new Date(`${selectedTimelineDate.value}T00:00:00Z`) : null);

const selectedPmtilesUrl = computed(() => {
  const date = selectedTimelineDate.value;
  const pmtiles = analyticsQuery.data.value?.data?.pmtiles ?? [];
  if (!date) return null;
  const hit = pickPmtilesForMetric(pmtiles, date, selectedMetric.value);
  return toBrowserReachablePmtilesUrl(hit?.pmtiles_url ?? null);
});

const selectedMetricLabel = computed(() => metricLabel(selectedMetric.value));

usePmtilesRenderer(
  map!.map,
  map!.styleReady,
  selectedPmtilesUrl,
  computed(() => selectedMetric.value),
  selectedMetricLabel,
);

watch(currentField, (v) => {
  if (v?.id) {
    fitTo(v.id);
  }
}, { immediate: true });

watch(timelineDates, (dates) => {
  if (!dates.length) {
    selectedTimelineDate.value = null;
    return;
  }
  const isoDates = new Set(dates.map((d) => d.toISOString().slice(0, 10)));
  if (!selectedTimelineDate.value || !isoDates.has(selectedTimelineDate.value)) {
    const last = dates[dates.length - 1];
    selectedTimelineDate.value = last.toISOString().slice(0, 10);
  }
}, { immediate: true });

watch(processedDates, (dates) => {
  selectedDatesToDelete.value = selectedDatesToDelete.value.filter((date) => dates.includes(date));
}, { immediate: true });

function startWorkflowForYear() {
  if (!pendingDates.value.length) return;
  startProcessingMutation.mutate();
}

function toggleDateToDelete(date: string) {
  if (selectedDatesToDelete.value.includes(date)) {
    selectedDatesToDelete.value = selectedDatesToDelete.value.filter((d) => d !== date);
    return;
  }
  selectedDatesToDelete.value = [...selectedDatesToDelete.value, date];
}

function onYearChange(value: unknown) {
  if (typeof value !== 'string') return;
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    selectedYear.value = parsed;
  }
}

function onMetricChange(value: unknown) {
  if (typeof value !== 'string') return;
  selectedMetric.value = value;
}

function metricLabel(metric: string) {
  return metricCatalog.find((item) => item.key === metric)?.label ?? metric;
}

function statusLabel(status?: string) {
  const normalized = (status ?? '').toUpperCase();
  if (normalized === 'COMPLETED') return 'Завершен';
  if (normalized === 'RUNNING') return 'Выполняется';
  if (normalized === 'FAILED') return 'Ошибка';
  if (normalized === 'PENDING') return 'Ожидание';
  if (normalized === 'CANCELED') return 'Отменен';
  return status ?? 'Неизвестно';
}

function pickPmtilesForMetric(
  artifacts: Array<{ analysis_date?: string; analysis_kind?: 'observed' | 'prediction'; module?: string; pmtiles_url?: string }>,
  date: string,
  metric: string,
) {
  const metricTarget = resolveMetricTarget(metric);
  const byDate = artifacts.filter((item) => item.analysis_date === date);
  if (!byDate.length) return undefined;

  if (metricTarget.kind === 'observed') {
    return byDate.find((item) => item.analysis_kind === 'observed');
  }
  return byDate.find((item) =>
    item.analysis_kind === 'prediction' && normalizeModule(item.module) === metricTarget.module,
  ) ?? byDate.find((item) => item.analysis_kind === 'prediction');
}

function resolveMetricTarget(metric: string): { kind: 'observed' } | { kind: 'prediction'; module: string } {
  if (['degradation_score', 'vegetation_cover_loss_score', 'bare_soil_expansion_score', 'heterogeneity_score'].includes(metric)) {
    return { kind: 'prediction', module: 'degradation' };
  }
  if (['health_score', 'stress_score_total', 'water_stress'].includes(metric)) {
    return { kind: 'prediction', module: 'health_stress' };
  }
  if (['confidence', 'under_irrigation_risk_score', 'over_irrigation_risk_score', 'uniformity_score'].includes(metric)) {
    return { kind: 'prediction', module: 'irrigation_water_use' };
  }
  return { kind: 'observed' };
}

function normalizeModule(module?: string) {
  if (!module) return '';
  if (module === 'm0') return 'degradation';
  if (module === 'm1') return 'health_stress';
  if (module === 'm2') return 'irrigation_water_use';
  return module;
}

function onTimelineChange(value: Date) {
  selectedTimelineDate.value = value.toISOString().slice(0, 10);
}

function normalizeStage(value?: string | null) {
  return (value ?? '').toLowerCase().replaceAll('-', '_');
}

function isStatusRunning(status?: string | null) {
  const normalized = (status ?? '').toUpperCase();
  return normalized === 'RUNNING' || normalized === 'PENDING' || normalized === 'IN_PROGRESS';
}

function mapStageToStep(stage?: string | null, stageLabel?: string | null) {
  const normalized = `${normalizeStage(stage)} ${normalizeStage(stageLabel)}`;
  const matched = workflowSteps.find((step) =>
    step.stageKeys.some((key) => normalized.includes(key)),
  );
  return matched?.number ?? 1;
}

function runStep(run: FieldWorkflowRun) {
  if ((run.status ?? '').toUpperCase() === 'COMPLETED') {
    return workflowSteps.length;
  }
  return mapStageToStep(run.stage, run.stage_label);
}

function toBrowserReachablePmtilesUrl(rawUrl: string | null) {
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl);
    const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    const api = new URL(apiBase);

    if (parsed.origin !== window.location.origin) {
      const objectPath = parsed.pathname.replace(/^\/+/, '');
      const segments = objectPath.split('/').filter(Boolean);
      if (!segments.length) return null;
      const bucket = segments[0];
      const alreadyBucketPrefixed = segments.length > 1 && segments[1] === bucket;
      const keyPath = alreadyBucketPrefixed ? objectPath : `${bucket}/${objectPath}`;
      return `${api.origin}/s3/${keyPath}`;
    }
    return rawUrl;
  } catch {
    const objectPath = rawUrl.replace(/^\/+/, '');
    const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    const api = new URL(apiBase);
    return `${api.origin}/s3/${objectPath}`;
  }
}

</script>
