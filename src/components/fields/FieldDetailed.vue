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
            <div class="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" @click="fitTo(currentField.id!)">Центрировать</Button>
              <Button variant="outline" size="sm" @click="downloadExport('csv', 'analytics')">Экспорт CSV</Button>
              <Button variant="outline" size="sm" @click="downloadExport('geojson', 'tiles')">Экспорт GeoJSON</Button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-xl border bg-white/90 shadow-sm">
      <button
        type="button"
        class="flex w-full items-center gap-2 p-4 text-left hover:bg-slate-50/90"
        :aria-expanded="sectionOpen.audit"
        aria-label="Свернуть или развернуть журнал изменений"
        @click="sectionOpen.audit = !sectionOpen.audit"
      >
        <ChevronDown
          class="size-5 shrink-0 text-slate-500 transition-transform duration-200"
          :class="sectionOpen.audit ? '' : '-rotate-90'"
        />
        <h2 class="text-lg font-semibold text-slate-900">Журнал изменений поля</h2>
      </button>
      <div v-show="sectionOpen.audit" class="border-t border-slate-100 px-4 pb-5 pt-4">
        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full min-w-[40rem] table-auto text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50/90 text-left">
                <th class="min-w-[11rem] whitespace-nowrap px-4 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Время
                </th>
                <th class="min-w-[10rem] whitespace-nowrap px-4 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Действие
                </th>
                <th class="min-w-[12rem] px-4 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Кто
                </th>
                <th class="min-w-[14rem] px-4 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Детали
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="row in auditRows"
                :key="row.entry.id"
                class="align-top transition-colors hover:bg-slate-50/70"
              >
                <td class="px-4 py-4 text-sm tabular-nums leading-relaxed text-slate-600">
                  {{ row.entry.created_at ? formatAuditTime(row.entry.created_at) : '—' }}
                </td>
                <td class="px-4 py-4">
                  <span
                    class="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-900 ring-1 ring-emerald-100/80"
                    :title="row.entry.action"
                  >
                    {{ auditActionLabel(row.entry.action) }}
                  </span>
                </td>
                <td class="max-w-[16rem] px-4 py-4">
                  <span class="block text-sm leading-relaxed text-slate-800">{{ row.actorLabel }}</span>
                </td>
                <td class="min-w-0 px-4 py-4">
                  <ul v-if="row.lines.length" class="space-y-3 text-sm leading-relaxed">
                    <li
                      v-for="(line, i) in row.lines"
                      :key="i"
                      class="grid gap-x-5 gap-y-1 sm:items-start"
                      :class="line.label ? 'grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)]' : 'grid-cols-1'"
                    >
                      <template v-if="line.label">
                        <span class="font-medium text-slate-600">{{ line.label }}</span>
                        <span class="min-w-0 break-words text-slate-800">{{ line.value }}</span>
                      </template>
                      <span v-else class="col-span-full min-w-0 break-words text-slate-800">{{ line.value }}</span>
                    </li>
                  </ul>
                  <span v-else class="text-sm text-slate-500">—</span>
                </td>
              </tr>
              <tr v-if="!auditRows.length">
                <td colspan="4" class="px-4 py-8 text-center text-sm text-slate-500">Записей пока нет</td>
              </tr>
            </tbody>
          </table>
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
          Запустить обработку
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
        Графики показывают только наблюдаемые значения во времени.
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <MetricSparkline
          v-for="m in chartMetrics"
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
        :aria-expanded="sectionOpen.mlSummary"
        aria-label="Свернуть или развернуть сводку машинного обучения"
        @click="sectionOpen.mlSummary = !sectionOpen.mlSummary"
      >
        <ChevronDown
          class="size-5 shrink-0 text-slate-500 transition-transform duration-200"
          :class="sectionOpen.mlSummary ? '' : '-rotate-90'"
        />
        <h2 class="text-lg font-semibold text-slate-900">Сводка прогноза (последняя обработка)</h2>
      </button>
      <div v-show="sectionOpen.mlSummary" class="border-t border-slate-100 px-4 pb-4 pt-3">
        <p v-if="!mlSummaryItems.length" class="text-sm text-slate-500">Нет агрегированных значений модели.</p>
        <div v-else class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="item in mlSummaryItems"
            :key="item.key"
            class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <div class="text-slate-600">{{ item.label }}</div>
            <div class="font-semibold text-slate-900">{{ item.value }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-xl border bg-white/90 shadow-sm">
      <button
        type="button"
        class="flex w-full items-center gap-2 p-4 text-left hover:bg-slate-50/90"
        :aria-expanded="sectionOpen.history"
        aria-label="Свернуть или развернуть историю обработок"
        @click="sectionOpen.history = !sectionOpen.history"
      >
        <ChevronDown
          class="size-5 shrink-0 text-slate-500 transition-transform duration-200"
          :class="sectionOpen.history ? '' : '-rotate-90'"
        />
        <h2 class="text-lg font-semibold text-slate-900">История обработок</h2>
      </button>
      <div v-show="sectionOpen.history" class="border-t border-slate-100 px-4 pb-4 pt-3">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[740px] text-sm">
          <thead>
            <tr class="border-b text-left text-slate-600">
              <th class="pb-2">Запуск</th>
              <th class="pb-2">Статус</th>
              <th class="pb-2">Период</th>
              <th class="pb-2">Длит.</th>
              <th class="pb-2">Ошибка</th>
              <th class="pb-2">Действия</th>
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
              <td class="py-3 text-xs">{{ run.duration_seconds != null ? `${run.duration_seconds}s` : '—' }}</td>
              <td class="py-3 max-w-[200px] truncate text-xs text-red-700" :title="run.failure_message ?? ''">
                {{ run.failure_message || '—' }}
              </td>
              <td class="py-3">
                <Button
                  v-if="isStatusRunning(run.status) && run.run_id"
                  variant="outline"
                  size="sm"
                  :disabled="terminateMutation.isPending.value"
                  @click="terminateMutation.mutate(run.run_id)"
                >
                  Остановить
                </Button>
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
              <td colspan="7" class="py-4 text-sm text-slate-500">Пока нет запусков обработки</td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </section>

    <Teleport to="#map-overlay-root">
      <div class="pointer-events-auto w-full min-w-0 max-w-full space-y-2 rounded-xl border bg-white/95 p-3 shadow-lg">
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
          <span class="text-xs text-slate-500">Наблюдение: {{ selectedTimelineDate ?? '—' }}</span>
          <div v-if="resolveMetricTarget(selectedMetric).kind === 'prediction'" class="flex items-center gap-2">
            <span class="text-xs text-slate-500">Прогноз (as-of):</span>
            <Select :model-value="selectedPredictedDate ?? ''" @update:model-value="onPredictedDateChange">
              <SelectTrigger class="h-8 w-40">
                <SelectValue placeholder="Выберите дату" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="d in predictedPmtilesDates" :key="d" :value="d">
                  {{ d }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <TimelinePicker :dates="timelineDates" :model-value="timelineModelDate" :height="72" @update:model-value="onTimelineChange" />
        <MapMetricLegend :pmtiles-url="selectedPmtilesUrl" :metric-field="selectedMetric" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  getFieldsById,
  getFieldsByIdAnalytics,
  getFieldsByIdAudit,
  getFieldsByIdWorkflows,
  getOrganizations,
  getOrganizationsByIdMembers,
  getSeasons,
  postFieldsByIdWorkflowsByRunIdTerminate,
  type FieldAnalyticsRow,
  type FieldDetail,
  type FieldWorkflowRun,
} from '@/api';

/** OpenAPI row type omits some prediction columns the API returns. */
type FieldAnalyticsRowExt = FieldAnalyticsRow & {
  prediction_vegetation_activity_drop?: number | null;
  prediction_heterogeneity_growth?: number | null;
  prediction_irrigation_events_detected?: number | null;
};
import { client } from '@/api/client.gen';
import { getAccessToken } from '@/auth/keycloak';
import { pushToast } from '@/lib/toastBus';
import { useMapPolygons } from '@/composables/useMapPolygons';
import { PMTILES_CATEGORICAL_METRIC_KEYS, usePmtilesRenderer } from '@/composables/usePmtilesRenderer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { ChevronDown } from 'lucide-vue-next';
import { PMTiles } from 'pmtiles';
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
import MapMetricLegend from './MapMetricLegend.vue';
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
  { number: 2, title: 'Спутник и погода', description: 'Сбор спутниковых и погодных признаков.', stageKeys: ['geo_metrics', 'gee'] },
  { number: 3, title: 'Модели и прогноз', description: 'Расчёты моделей по тайлам и временным рядам.', stageKeys: ['ml_analytics', 'ml'] },
  { number: 4, title: 'Тайлы карты', description: 'Формирование векторных тайлов для отображения на карте.', stageKeys: ['parallel', 'pmtiles'] },
  { number: 5, title: 'Финализация', description: 'Сохранение агрегатов в базу данных.', stageKeys: ['finalize_db', 'db', 'completed', 'complete'] },
];

const route = useRoute('/fields/[id]');
const queryClient = useQueryClient();

const sectionOpen = reactive({
  overview: true,
  audit: true,
  processing: true,
  charts: true,
  mlSummary: true,
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

const orgsQuery = useQuery({
  queryKey: ['organizations'],
  queryFn: () => getOrganizations(),
});

const currentOrgId = computed(() => currentField.value?.organization_id ?? '');

const membersQuery = useQuery({
  queryKey: ['orgMembers', currentOrgId],
  queryFn: () => getOrganizationsByIdMembers({ path: { id: currentOrgId.value } }),
  enabled: computed(() => Boolean(currentOrgId.value)),
});

const seasonsQuery = useQuery({
  queryKey: ['fieldSeasons', fieldId],
  queryFn: () => getSeasons({ query: { field_id: fieldId.value as string } }),
  enabled: computed(() => Boolean(fieldId.value)),
});

const orgNameById = computed(() => {
  const m = new Map<string, string>();
  for (const o of orgsQuery.data.value?.data?.organizations ?? []) {
    if (o.id) m.set(o.id, (o.name ?? '').trim() || 'Без названия');
  }
  return m;
});

const memberLabelByUserId = computed(() => {
  const m = new Map<string, string>();
  for (const mem of membersQuery.data.value?.data?.members ?? []) {
    const id = mem.user_id;
    if (!id) continue;
    const name = [mem.first_name, mem.last_name].filter(Boolean).join(' ').trim();
    const label = name || (mem.email ?? '').trim() || (mem.username ?? '').trim();
    m.set(id, label || 'Участник');
  }
  return m;
});

const seasonNameById = computed(() => {
  const m = new Map<string, string>();
  for (const s of seasonsQuery.data.value?.data?.seasons ?? []) {
    if (s.id) m.set(s.id, (s.name ?? '').trim() || 'Сезон');
  }
  return m;
});

const launchError = ref<string | null>(null);
const selectedTimelineDate = ref<string | null>(null);
const selectedPredictedDate = ref<string | null>(null);
const selectedMetric = ref<string>('ndvi');
const selectedYear = ref(new Date().getFullYear());
const selectedDatesToDelete = ref<string[]>([]);
const yearOptions = computed(() => {
  const current = new Date().getFullYear();
  return [current, current - 1];
});

/** chartable: false — только слой карты (PMTiles), строковые enum из ML-контракта. */
type MetricItem = {
  key: string;
  label: string;
  group: string;
  chartable?: boolean;
};

const metricCatalog: MetricItem[] = [
  { key: 'ndvi', label: 'Индекс NDVI (вегетация)', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'ndmi', label: 'Индекс NDMI (влажность растительности)', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'ndre', label: 'Индекс NDRE (хлорофилл)', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'gndvi', label: 'Индекс GNDVI', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'msavi', label: 'Индекс MSAVI', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'nbr2', label: 'Индекс NBR2 (почва/гарь)', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'bare_soil_index', label: 'Индекс оголенной почвы', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'valid_pixel_ratio', label: 'Доля валидных пикселей', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'temperature_c_mean', label: 'Средняя температура, °C', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'precipitation_mm_3d', label: 'Осадки за 3 дня, мм', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'precipitation_mm_7d', label: 'Осадки за 7 дней, мм', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'precipitation_mm_30d', label: 'Осадки за 30 дней, мм', group: 'Наблюдаемые (спутник/погода)' },
  { key: 'degradation_score', label: 'Оценка деградации', group: 'Прогноз: деградация' },
  { key: 'degradation_class', label: 'Класс деградации (категория)', group: 'Прогноз: деградация', chartable: false },
  { key: 'health_score', label: 'Оценка состояния (здоровье)', group: 'Прогноз: здоровье/стресс' },
  { key: 'stress_score_total', label: 'Суммарный стресс', group: 'Прогноз: здоровье/стресс' },
  { key: 'water_stress', label: 'Водный стресс', group: 'Прогноз: здоровье/стресс' },
  { key: 'vegetation_activity_drop', label: 'Падение вегетации (модуль 1)', group: 'Прогноз: здоровье/стресс' },
  { key: 'heterogeneity_growth', label: 'Рост неоднородности (модуль 1)', group: 'Прогноз: здоровье/стресс' },
  { key: 'confidence', label: 'Уверенность модели', group: 'Прогноз: полив' },
  { key: 'forecast_projected_score_m0', label: 'Forecast m0: прогнозируемый скор (14д)', group: 'Прогноз: short-horizon forecast' },
  { key: 'forecast_confidence_m0', label: 'Forecast m0: уверенность', group: 'Прогноз: short-horizon forecast' },
  { key: 'forecast_direction_m0', label: 'Forecast m0: направление (категория)', group: 'Прогноз: short-horizon forecast', chartable: false },
  { key: 'forecast_projected_score_m1', label: 'Forecast m1: прогнозируемый скор (14д)', group: 'Прогноз: short-horizon forecast' },
  { key: 'forecast_confidence_m1', label: 'Forecast m1: уверенность', group: 'Прогноз: short-horizon forecast' },
  { key: 'forecast_direction_m1', label: 'Forecast m1: направление (категория)', group: 'Прогноз: short-horizon forecast', chartable: false },
  { key: 'forecast_projected_score_m2', label: 'Forecast m2: прогнозируемый скор (14д)', group: 'Прогноз: short-horizon forecast' },
  { key: 'forecast_confidence_m2', label: 'Forecast m2: уверенность', group: 'Прогноз: short-horizon forecast' },
  { key: 'forecast_direction_m2', label: 'Forecast m2: направление (категория)', group: 'Прогноз: short-horizon forecast', chartable: false },
  { key: 'irrigation_events_detected', label: 'Число событий орошения', group: 'Прогноз: полив' },
  { key: 'irrigation_status', label: 'Статус орошения (категория)', group: 'Прогноз: полив', chartable: false },
  { key: 'water_balance_risk', label: 'Риск водного баланса (категория)', group: 'Прогноз: полив', chartable: false },
  { key: 'trend', label: 'Тренд (категория)', group: 'Прогноз: общее', chartable: false },
  { key: 'alert_level', label: 'Уровень тревоги (категория)', group: 'Прогноз: общее', chartable: false },
];

const chartMetrics = computed(() =>
  metricCatalog.filter((m) => observedAnalyticsColumn[m.key] !== undefined),
);

const observedAnalyticsColumn: Partial<Record<MetricItem['key'], keyof FieldAnalyticsRow>> = {
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

const predictedAnalyticsColumn: Partial<Record<MetricItem['key'], keyof FieldAnalyticsRowExt>> = {
  degradation_score: 'prediction_degradation_score',
  health_score: 'prediction_health_score',
  stress_score_total: 'prediction_stress_score_total',
  water_stress: 'prediction_water_stress',
  vegetation_activity_drop: 'prediction_vegetation_activity_drop',
  heterogeneity_growth: 'prediction_heterogeneity_growth',
  confidence: 'prediction_confidence',
  irrigation_events_detected: 'prediction_irrigation_events_detected',
};

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

const runStatusById = ref<Map<string, string>>(new Map());
watch(
  () => workflowsQuery.data.value?.data?.runs,
  (runs) => {
    if (!runs) return;
    for (const run of runs) {
      const rid = run.run_id ?? '';
      if (!rid) continue;
      const prev = runStatusById.value.get(rid);
      const st = run.status ?? '';
      if (prev !== undefined && prev !== st) {
        if (st === 'COMPLETED') pushToast('Обработка поля завершена');
        if (st === 'FAILED') pushToast('Обработка завершилась с ошибкой');
      }
      runStatusById.value.set(rid, st);
    }
  },
  { deep: true },
);

const auditQuery = useQuery({
  queryKey: ['fieldAudit', fieldId],
  queryFn: ({ queryKey }) => getFieldsByIdAudit({ path: { id: queryKey[1] as string } }),
  enabled: computed(() => Boolean(fieldId.value)),
});

type AuditEntry = {
  id?: string;
  action?: string;
  actor_user_id?: string;
  payload?: unknown;
  created_at?: string;
};

const auditEntries = computed(() => (auditQuery.data.value?.data?.entries ?? []) as AuditEntry[]);

const AUDIT_ACTION_LABELS: Record<string, string> = {
  'field.created': 'Создание поля',
  'field.updated': 'Изменение поля',
  'field.deleted': 'Удаление поля',
  'season.created': 'Сезон добавлен',
  'season.updated': 'Сезон изменён',
  'season.deleted': 'Сезон удалён',
};

const AUDIT_KEY_LABELS: Record<string, string> = {
  name: 'Название',
  organization_id: 'Организация',
  field_id: 'Поле',
  season_id: 'Сезон',
  description: 'Описание',
  start: 'Начало',
  end: 'Окончание',
  is_auto: 'Авто',
  before: 'Было',
  after: 'Стало',
};

function auditActionLabel(action: string | undefined): string {
  if (!action) return '—';
  return AUDIT_ACTION_LABELS[action] ?? action;
}

function formatAuditTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatPayload(p: unknown): string {
  if (p == null) return '';
  try {
    return JSON.stringify(p, null, 2);
  } catch {
    return String(p);
  }
}

type AuditResolveCtx = {
  orgMap: Map<string, string>;
  userMap: Map<string, string>;
  seasonMap: Map<string, string>;
  field: FieldDetail | undefined;
};

function looksLikeUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function auditFormatScalar(v: unknown, payloadKey: string, ctx: AuditResolveCtx): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'да' : 'нет';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    if (v === '') return '—';
    if (looksLikeUuid(v)) {
      if (payloadKey === 'organization_id')
        return ctx.orgMap.get(v) ?? 'Неизвестная организация';
      if (payloadKey === 'field_id')
        return ctx.field?.id === v ? (ctx.field.name ?? 'Это поле') : 'Другое поле';
      if (payloadKey === 'season_id') return ctx.seasonMap.get(v) ?? 'Сезон';
    }
    return v;
  }
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

type AuditLine = { label: string; value: string };

function auditPayloadLines(payload: unknown, ctx: AuditResolveCtx): AuditLine[] {
  if (payload == null) return [];
  if (typeof payload !== 'object' || Array.isArray(payload)) {
    const compact = formatPayload(payload).replace(/\s+/g, ' ').trim();
    return compact ? [{ label: '', value: compact }] : [];
  }
  const o = payload as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.length === 0) return [{ label: '', value: '—' }];

  const lines: AuditLine[] = [];
  for (const [k, v] of Object.entries(o)) {
    const baseLabel = AUDIT_KEY_LABELS[k] ?? k.replace(/_/g, ' ');
    if (
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      'from' in (v as object) &&
      'to' in (v as object)
    ) {
      const ch = v as { from: unknown; to: unknown };
      lines.push({
        label: baseLabel,
        value: `«${auditFormatScalar(ch.from, k, ctx)}» → «${auditFormatScalar(ch.to, k, ctx)}»`,
      });
      continue;
    }
    if (
      typeof v === 'object' &&
      v !== null &&
      !Array.isArray(v) &&
      (k === 'before' || k === 'after')
    ) {
      const prefix = AUDIT_KEY_LABELS[k] ?? k;
      const nested = v as Record<string, unknown>;
      for (const [nk, nv] of Object.entries(nested)) {
        const nl = AUDIT_KEY_LABELS[nk] ?? nk.replace(/_/g, ' ');
        lines.push({ label: `${prefix} · ${nl}`, value: auditFormatScalar(nv, nk, ctx) });
      }
      continue;
    }
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      for (const [nk, nv] of Object.entries(v as Record<string, unknown>)) {
        const nl = AUDIT_KEY_LABELS[nk] ?? nk.replace(/_/g, ' ');
        const label = `${baseLabel}: ${nl}`;
        if (
          nv !== null &&
          typeof nv === 'object' &&
          !Array.isArray(nv) &&
          'from' in nv &&
          'to' in nv
        ) {
          const ch = nv as { from: unknown; to: unknown };
          lines.push({
            label,
            value: `«${auditFormatScalar(ch.from, nk, ctx)}» → «${auditFormatScalar(ch.to, nk, ctx)}»`,
          });
        } else {
          lines.push({ label, value: auditFormatScalar(nv, nk, ctx) });
        }
      }
      continue;
    }
    lines.push({ label: baseLabel, value: auditFormatScalar(v, k, ctx) });
  }
  return lines;
}

function resolveActorLabel(userId: string | undefined, userMap: Map<string, string>): string {
  if (!userId) return '—';
  return userMap.get(userId) ?? 'Не в списке участников';
}

const auditRows = computed(() => {
  const ctx: AuditResolveCtx = {
    orgMap: orgNameById.value,
    userMap: memberLabelByUserId.value,
    seasonMap: seasonNameById.value,
    field: currentField.value,
  };
  return auditEntries.value.map((e) => ({
    entry: e,
    actorLabel: resolveActorLabel(e.actor_user_id, ctx.userMap),
    lines: auditPayloadLines(e.payload, ctx),
  }));
});

async function downloadExport(format: 'csv' | 'geojson', kind: 'analytics' | 'tiles') {
  const id = fieldId.value as string;
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';
  const token = await getAccessToken();
  if (!token) {
    launchError.value = 'Нет токена авторизации';
    return;
  }
  const url = `${base.replace(/\/$/, '')}/fields/${id}/export?format=${format}&kind=${kind}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      launchError.value = await res.text();
      return;
    }
    const blob = await res.blob();
    const cd = res.headers.get('Content-Disposition');
    let fn = `field-export.${format === 'csv' ? 'csv' : 'geojson'}`;
    const m = cd?.match(/filename="([^"]+)"/);
    if (m) fn = m[1];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fn;
    a.click();
    URL.revokeObjectURL(a.href);
    launchError.value = null;
  } catch (e) {
    launchError.value = e instanceof Error ? e.message : 'export failed';
  }
}

const terminateMutation = useMutation({
  mutationFn: async (runId: string) => {
    const id = fieldId.value as string;
    await postFieldsByIdWorkflowsByRunIdTerminate({ path: { id, runId } });
  },
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['fieldWorkflows', fieldId] });
    pushToast('Запрос на остановку отправлен');
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

/** Per-URL attribute names from PMTiles tilestats (null = loading for current date). */
const pmtilesAttrsByUrl = ref<Map<string, Set<string>> | null>(null);

async function refreshPmtilesAttrs() {
  const date = selectedTimelineDate.value;
  const predictionDate = selectedPredictedDate.value;
  const pmtiles = analyticsQuery.data.value?.data?.pmtiles ?? [];
  if (!date && !predictionDate) {
    pmtilesAttrsByUrl.value = null;
    return;
  }
  const observedUrls = [
    ...new Set(
      pmtiles
        .filter((p) => date && p.analysis_date === date && p.pmtiles_url && p.analysis_kind !== 'prediction')
        .map((p) => toBrowserReachablePmtilesUrl(p.pmtiles_url))
        .filter((u): u is string => Boolean(u)),
    ),
  ];
  const predictionUrls = [
    ...new Set(
      pmtiles
        .filter((p) => p.analysis_kind === 'prediction' && p.pmtiles_url && (!predictionDate || p.analysis_date === predictionDate))
        .map((p) => toBrowserReachablePmtilesUrl(p.pmtiles_url))
        .filter((u): u is string => Boolean(u)),
    ),
  ];
  const urls = [...new Set([...observedUrls, ...predictionUrls])];
  if (!urls.length) {
    pmtilesAttrsByUrl.value = new Map();
    return;
  }
  pmtilesAttrsByUrl.value = null;
  const next = new Map<string, Set<string>>();
  await Promise.all(
    urls.map(async (url) => {
      try {
        const pm = new PMTiles(url);
        const meta = (await pm.getMetadata()) as {
          tilestats?: { layers?: Array<{ layer?: string; attributes?: Array<{ attribute?: string }> }> };
        };
        const layers = meta.tilestats?.layers ?? [];
        const layer = layers.find((l) => l.layer === 'tiles') ?? layers[0];
        const names = new Set(
          (layer?.attributes ?? []).map((a) => a.attribute).filter((x): x is string => Boolean(x)),
        );
        next.set(url, names);
      } catch {
        next.set(url, new Set());
      }
    }),
  );
  pmtilesAttrsByUrl.value = next;
}

watch(
  [selectedTimelineDate, selectedPredictedDate, () => analyticsQuery.data.value?.data?.pmtiles],
  () => {
    void refreshPmtilesAttrs();
  },
  { immediate: true, deep: true },
);

const availableMapMetricKeys = computed(() => {
  const date = selectedTimelineDate.value;
  const pmtiles = analyticsQuery.data.value?.data?.pmtiles ?? [];
  const attrsMap = pmtilesAttrsByUrl.value;
  if (!date) return new Set(metricCatalog.map((m) => m.key));
  if (attrsMap === null) return new Set(metricCatalog.map((m) => m.key));
  const keys: string[] = [];
  for (const m of metricCatalog) {
    const hit = pickPmtilesForMetric(pmtiles, date, m.key, attrsMap, selectedPredictedDate.value);
    if (!hit?.pmtiles_url) continue;
    const url = toBrowserReachablePmtilesUrl(hit.pmtiles_url);
    if (!url) continue;
    const attrs = attrsMap.get(url);
    if (PMTILES_CATEGORICAL_METRIC_KEYS.has(m.key)) {
      if (!attrs || attrs.size === 0) keys.push(m.key);
      else if (attrs.has(m.key)) keys.push(m.key);
      continue;
    }
    if (!attrs || attrs.size === 0) continue;
    if (attrs.has(m.key)) keys.push(m.key);
  }
  return new Set(keys);
});

const groupedMetrics = computed(() => {
  const allowed = availableMapMetricKeys.value;
  const groups = new Map<string, string[]>();
  for (const metric of metricCatalog) {
    if (!allowed.has(metric.key)) continue;
    if (!groups.has(metric.group)) groups.set(metric.group, []);
    groups.get(metric.group)!.push(metric.key);
  }
  return Array.from(groups.entries())
    .filter(([, metrics]) => metrics.length > 0)
    .map(([title, metrics]) => ({ title, metrics }));
});

watch(
  availableMapMetricKeys,
  (allowed) => {
    if (!allowed.size) return;
    if (!allowed.has(selectedMetric.value)) {
      const first = metricCatalog.find((m) => allowed.has(m.key));
      if (first) selectedMetric.value = first.key;
    }
  },
  { immediate: true },
);

const observedChartByMetric = computed(() => {
  const yearPrefix = String(selectedYear.value);
  const rows = analyticsQuery.data.value?.data?.analytics ?? [];
  const out: Record<string, Array<{ date: string; value: number }>> = {};
  for (const item of chartMetrics.value) {
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
  for (const item of chartMetrics.value) {
    out[item.key] = [];
  }
  for (const row of predRows) {
    const r = row as FieldAnalyticsRowExt;
    const od = r.observation_date;
    if (!od) continue;
    const date = od.slice(0, 10);
    for (const item of chartMetrics.value) {
      const key = item.key;
      const col = predictedAnalyticsColumn[key];
      if (!col) continue;
      const raw = r[col];
      if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
      out[key]!.push({ date, value: raw });
    }
  }
  for (const item of chartMetrics.value) {
    out[item.key]!.sort((a, b) => a.date.localeCompare(b.date));
  }
  return out;
});

const latestPredictedRow = computed(() => {
  const rows = analyticsQuery.data.value?.data?.analytics ?? [];
  const predicted = rows.filter((r) => r.source === 'predicted' && !!r.observation_date);
  predicted.sort((a, b) => (a.observation_date ?? '').localeCompare(b.observation_date ?? ''));
  return predicted[predicted.length - 1];
});

function formatSummaryValue(v: unknown): string {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)) : v.toFixed(2);
  }
  if (typeof v === 'string' && v.trim() !== '') return v;
  return '—';
}

const mlSummaryItems = computed(() => {
  const row = latestPredictedRow.value as FieldAnalyticsRowExt | undefined;
  if (!row) return [] as Array<{ key: string; label: string; value: string }>;
  const items = [
    { key: 'prediction_degradation_score', label: 'Оценка деградации', raw: row.prediction_degradation_score },
    { key: 'prediction_health_score', label: 'Оценка состояния (здоровье)', raw: row.prediction_health_score },
    { key: 'prediction_stress_score_total', label: 'Суммарный стресс', raw: row.prediction_stress_score_total },
    { key: 'prediction_water_stress', label: 'Водный стресс', raw: row.prediction_water_stress },
    { key: 'prediction_vegetation_activity_drop', label: 'Падение вегетации (модуль 1)', raw: row.prediction_vegetation_activity_drop },
    { key: 'prediction_heterogeneity_growth', label: 'Рост неоднородности (модуль 1)', raw: row.prediction_heterogeneity_growth },
    { key: 'prediction_confidence', label: 'Уверенность модели', raw: row.prediction_confidence },
    { key: 'prediction_irrigation_events_detected', label: 'Число событий орошения', raw: row.prediction_irrigation_events_detected },
  ];
  return items
    .filter((x) => x.raw !== null && x.raw !== undefined)
    .map((x) => ({ key: x.key, label: x.label, value: formatSummaryValue(x.raw) }));
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
    analyticsQuery.data.value?.data?.analytics
      ?.filter((row) => row.source !== 'predicted')
      .map((row) => row.observation_date)
      .filter((d): d is string => Boolean(d)) ?? [];
  const artifactDates =
    analyticsQuery.data.value?.data?.pmtiles
      ?.filter((row) => row.analysis_kind !== 'prediction')
      .map((row) => row.analysis_date)
      .filter((d): d is string => Boolean(d)) ?? [];
  const merged = Array.from(new Set([...analyticDates, ...artifactDates]));
  return merged
    .filter((date) => processed.has(date))
    .map((date) => new Date(`${date}T00:00:00Z`));
});
const timelineModelDate = computed(() => selectedTimelineDate.value ? new Date(`${selectedTimelineDate.value}T00:00:00Z`) : null);

const predictedPmtilesDates = computed(() => {
  const pmtiles = analyticsQuery.data.value?.data?.pmtiles ?? [];
  const dates = pmtiles
    .filter((row) => row.analysis_kind === 'prediction' && !!row.analysis_date)
    .map((row) => row.analysis_date)
    .filter((d): d is string => Boolean(d));
  return Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
});

const selectedPmtilesUrl = computed(() => {
  const metricTarget = resolveMetricTarget(selectedMetric.value);
  const date = metricTarget.kind === 'prediction' ? selectedPredictedDate.value : selectedTimelineDate.value;
  const pmtiles = analyticsQuery.data.value?.data?.pmtiles ?? [];
  if (!date) return null;
  const hit = pickPmtilesForMetric(
    pmtiles,
    date,
    selectedMetric.value,
    pmtilesAttrsByUrl.value,
    selectedPredictedDate.value,
  );
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

watch(predictedPmtilesDates, (dates) => {
  if (!dates.length) {
    selectedPredictedDate.value = null;
    return;
  }
  if (!selectedPredictedDate.value || !dates.includes(selectedPredictedDate.value)) {
    selectedPredictedDate.value = dates[0];
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
  attributeByUrl?: Map<string, Set<string>> | null,
  predictionDate?: string | null,
) {
  const metricTarget = resolveMetricTarget(metric);
  const byDate = artifacts.filter((item) => item.analysis_date === date);
  const observedForDate = byDate.filter((item) => item.analysis_kind !== 'prediction');

  if (metricTarget.kind === 'observed') {
    if (!observedForDate.length) return undefined;
    return observedForDate.find((item) => item.analysis_kind === 'observed') ?? observedForDate[0];
  }

  const predPool = artifacts.filter((item) => {
    if (item.analysis_kind !== 'prediction') return false;
    if (!predictionDate) return true;
    return item.analysis_date === predictionDate;
  });
  if (!predPool.length) return undefined;

  const predByModule = (mod: string) =>
    predPool.find((item) => normalizeModule(item.module) === mod);

  // trend / alert: предпочитаем слой, где в tilestats есть это поле
  if (metric === 'trend' || metric === 'alert_level') {
    const order = ['degradation', 'health_stress', 'irrigation_water_use'] as const;
    if (attributeByUrl) {
      for (const mod of order) {
        const hit = predByModule(mod);
        if (!hit?.pmtiles_url) continue;
        const u = toBrowserReachablePmtilesUrl(hit.pmtiles_url);
        if (u && attributeByUrl.get(u)?.has(metric)) return hit;
      }
      for (const item of predPool) {
        const u = toBrowserReachablePmtilesUrl(item.pmtiles_url);
        if (u && attributeByUrl.get(u)?.has(metric)) return item;
      }
    }
    return (
      predByModule('degradation')
      ?? predByModule('health_stress')
      ?? predByModule('irrigation_water_use')
      ?? predPool[0]
    );
  }
  return predByModule(metricTarget.module) ?? predPool[0];
}

function resolveMetricTarget(metric: string): { kind: 'observed' } | { kind: 'prediction'; module: string } {
  if (
    [
      'degradation_score',
      'degradation_class',
      'forecast_projected_score_m0',
      'forecast_confidence_m0',
      'forecast_direction_m0',
      'trend',
      'alert_level',
    ].includes(metric)
  ) {
    return { kind: 'prediction', module: 'degradation' };
  }
  if (
    ['health_score', 'stress_score_total', 'water_stress', 'vegetation_activity_drop', 'heterogeneity_growth', 'forecast_projected_score_m1', 'forecast_confidence_m1', 'forecast_direction_m1'].includes(
      metric,
    )
  ) {
    return { kind: 'prediction', module: 'health_stress' };
  }
  if (
    [
      'confidence',
      'forecast_projected_score_m2',
      'forecast_confidence_m2',
      'forecast_direction_m2',
      'irrigation_events_detected',
      'irrigation_status',
      'water_balance_risk',
    ].includes(metric)
  ) {
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

function onPredictedDateChange(value: unknown) {
  if (typeof value !== 'string') return;
  selectedPredictedDate.value = value || null;
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

function toBrowserReachablePmtilesUrl(rawUrl: string | null | undefined) {
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
