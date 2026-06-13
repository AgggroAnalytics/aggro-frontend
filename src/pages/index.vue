<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-8 py-4 pb-10">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Обзор</h1>
        <p v-if="greeting" class="text-sm text-slate-600">{{ greeting }}</p>
        <p v-else class="text-sm text-slate-600">
          Сводка организации: одним запросом статистика, NDVI, аудит, задачи, погода и цели сезона.
        </p>
      </header>

      <div
        v-if="!currentOrgId"
        class="rounded-xl border border-amber-200 bg-amber-50/90 p-5 text-sm text-amber-950 shadow-sm"
      >
        <p class="font-medium">Выберите организацию в шапке</p>
        <RouterLink
          to="/organization"
          class="mt-3 inline-flex text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
        >
          Перейти к организациям
        </RouterLink>
      </div>

      <template v-else>
        <p class="text-sm text-slate-500">
          Организация:
          <span class="font-medium text-slate-800">{{ currentOrgName }}</span>
        </p>

        <p v-if="dashboardQuery.isError.value" class="text-sm text-red-700">
          Не удалось загрузить дашборд. Проверьте API и миграции БД.
        </p>

        <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="card in kpiCards"
            :key="card.key"
            class="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/5"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {{ card.label }}
                </p>
                <p class="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                  {{ card.value }}
                </p>
                <p v-if="card.hint" class="mt-1 text-xs text-slate-500">{{ card.hint }}</p>
              </div>
              <component :is="card.icon" class="size-9 shrink-0 text-emerald-700/85" aria-hidden="true" />
            </div>
          </article>
        </section>

        <div class="grid gap-6 lg:grid-cols-2">
          <section class="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <h2 class="text-sm font-semibold text-slate-900">NDVI по неделям (организация)</h2>
            <p class="mt-0.5 text-xs text-slate-500">Среднее по наблюдаемым полевым рядам, 8 недель.</p>
            <div class="mt-3">
              <DashboardNdviChart :points="ndviWeekly" />
            </div>
            <div v-if="tpNdviLine" class="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <span class="font-medium">Цель NDVI:</span>
              {{ tpNdviLine.target.toFixed(2) }}, факт:
              {{ tpNdviLine.latest.toFixed(2) }}
              <span :class="tpNdviLine.meets ? 'text-emerald-700' : 'text-amber-800'">
                — {{ tpNdviLine.meets ? 'порог достигнут' : 'ниже цели' }}
              </span>
            </div>
          </section>

          <section class="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <h2 class="text-sm font-semibold text-slate-900">Погода (центроид полей)</h2>
            <p class="mt-0.5 text-xs text-slate-500">Прокси Open-Meteo, без отдельного ключа.</p>
            <div v-if="weatherQuery.isPending.value" class="mt-3 text-sm text-slate-500">Загрузка…</div>
            <p v-else-if="weatherQuery.isError.value" class="mt-3 text-sm text-amber-800">
              Нет координат или сеть недоступна.
            </p>
            <ul v-else-if="weatherCurrent" class="mt-3 space-y-1 text-sm text-slate-800">
              <li v-if="weatherCurrent.temp != null">
                <span class="text-slate-500">Сейчас:</span>
                {{ weatherCurrent.temp }}°C
              </li>
              <li v-if="weatherCurrent.humidity != null">
                <span class="text-slate-500">Влажность:</span>
                {{ weatherCurrent.humidity }}%
              </li>
              <li v-if="weatherCurrent.wind != null">
                <span class="text-slate-500">Ветер:</span>
                {{ weatherCurrent.wind }} м/с
              </li>
            </ul>
            <p v-else class="mt-3 text-sm text-slate-500">Нет данных текущей погоды.</p>
          </section>
        </div>

        <section class="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-900">Цели сезона (JSON)</h2>
          <p class="mt-0.5 text-xs text-slate-500">
            Для руководителей и менеджеров. Сравнение с NDVI см. выше.
          </p>
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <label class="block text-xs text-slate-600">
              ndvi_target
              <input
                v-model.number="targetsForm.ndvi_target"
                type="number"
                step="0.01"
                min="0"
                max="1"
                class="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label class="block text-xs text-slate-600">
              health_score_target
              <input
                v-model.number="targetsForm.health_score_target"
                type="number"
                step="0.01"
                min="0"
                max="1"
                class="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label class="block text-xs text-slate-600 sm:col-span-3">
              notes
              <input
                v-model="targetsForm.notes"
                type="text"
                class="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <button
            type="button"
            class="mt-3 rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            :disabled="seasonPatch.isPending.value"
            @click="saveSeasonTargets"
          >
            Сохранить цели
          </button>
        </section>

        <section class="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-amber-950">Запустить обработку</h2>
            <RouterLink to="/fields" class="text-xs font-medium text-emerald-800 hover:underline">К карте</RouterLink>
          </div>
          <p class="mt-1 text-xs text-amber-900/90">
            Поля с тайлами, но без свежей наблюдаемой аналитики (нет данных или старше 30 дней).
          </p>
          <ul v-if="staleFields.length" class="mt-2 space-y-2 text-sm">
            <li
              v-for="s in staleFields"
              :key="String(s.field_id)"
              class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 px-3 py-2"
            >
              <RouterLink :to="`/fields/${s.field_id}`" class="font-medium text-emerald-900 hover:underline">
                {{ s.name }}
              </RouterLink>
              <RouterLink
                :to="`/fields/${s.field_id}`"
                class="text-xs text-amber-900 underline-offset-2 hover:underline"
              >
                Открыть → запуск workflow
              </RouterLink>
            </li>
          </ul>
          <p v-else class="mt-2 text-sm text-amber-900/80">Таких полей нет — хороший знак.</p>
        </section>

        <section class="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-900">Быстрый экспорт</h2>
          <p class="mt-0.5 text-xs text-slate-500">
            CSV аналитики с фильтром дат и GeoJSON тайлов (как на карточке поля).
          </p>
          <div v-if="!quickFields.length" class="mt-2 text-sm text-slate-500">Нет полей для пресетов.</div>
          <div v-else class="mt-3 space-y-4">
            <div v-for="qf in quickFields" :key="qf.id" class="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
              <p class="text-sm font-medium text-slate-800">{{ qf.name }}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                  @click="doExport(qf.id!, 'csv', 'analytics', datePresetLast30Days())"
                >
                  CSV · 30 дней
                </button>
                <button
                  type="button"
                  class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                  @click="doExport(qf.id!, 'csv', 'analytics', datePresetLastMonth())"
                >
                  CSV · прошлый месяц
                </button>
                <button
                  type="button"
                  class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                  @click="doExport(qf.id!, 'geojson', 'tiles')"
                >
                  GeoJSON тайлов
                </button>
              </div>
            </div>
          </div>
        </section>

        <div class="grid gap-6 lg:grid-cols-2">
          <section class="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div class="mb-3 flex items-center justify-between gap-2">
              <h2 class="text-sm font-semibold text-slate-900">Сейчас в работе</h2>
              <RouterLink to="/jobs" class="text-xs font-medium text-emerald-700 hover:underline">Все задачи</RouterLink>
            </div>
            <ul v-if="runningRuns.length" class="space-y-2 text-sm">
              <li
                v-for="(row, i) in runningRuns"
                :key="`${row.field_id}-${(row.run as { run_id?: string })?.run_id}-${i}`"
                class="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-slate-50/80 px-3 py-2"
              >
                <RouterLink :to="`/fields/${row.field_id}`" class="font-medium text-emerald-800 hover:underline">
                  {{ row.field_name || 'Поле' }}
                </RouterLink>
                <span class="text-xs text-slate-600">
                  {{ (row.run as { stage_label?: string; stage?: string })?.stage_label || (row.run as { stage?: string })?.stage || '…' }}
                </span>
              </li>
            </ul>
            <p v-else class="text-sm text-slate-500">Нет активных запусков.</p>
          </section>

          <section class="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div class="mb-3 flex items-center justify-between gap-2">
              <h2 class="text-sm font-semibold text-slate-900">Поля (быстрый список)</h2>
              <RouterLink to="/fields" class="text-xs font-medium text-emerald-700 hover:underline">Карта</RouterLink>
            </div>
            <ul v-if="quickFields.length" class="divide-y divide-slate-100 text-sm">
              <li v-for="qf in quickFields" :key="qf.id" class="flex justify-between gap-2 py-2 first:pt-0 last:pb-0">
                <RouterLink :to="`/fields/${qf.id}`" class="font-medium text-slate-800 hover:underline">
                  {{ qf.name }}
                </RouterLink>
              </li>
            </ul>
            <p v-else class="text-sm text-slate-500">Пока нет полей.</p>
          </section>
        </div>

        <section v-if="failedRuns.length" class="rounded-xl border border-red-200/80 bg-red-50/50 p-4 shadow-sm">
          <h2 class="text-sm font-semibold text-red-900">Ошибки пайплайна</h2>
          <ul class="mt-2 space-y-2 text-sm">
            <li
              v-for="(row, i) in failedRuns"
              :key="`fail-${row.field_id}-${i}`"
              class="rounded-lg border border-red-100 bg-white/80 px-3 py-2"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <RouterLink :to="`/fields/${row.field_id}`" class="font-medium text-red-900 hover:underline">
                  {{ row.field_name }}
                </RouterLink>
                <span class="text-xs text-red-700/80">
                  {{ (row.run as { closed_at?: string })?.closed_at ? formatShort((row.run as { closed_at?: string }).closed_at!) : '' }}
                </span>
              </div>
              <p class="mt-1 line-clamp-2 text-xs text-red-800/90">
                {{ (row.run as { failure_message?: string })?.failure_message || '—' }}
              </p>
            </li>
          </ul>
        </section>

        <section class="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-slate-900">Лента аудита</h2>
            <button
              type="button"
              class="text-xs font-medium text-emerald-700 hover:underline"
              @click="showFullAudit = !showFullAudit"
            >
              {{ showFullAudit ? 'Свернуть' : 'Полная лента' }}
            </button>
          </div>
          <ul class="space-y-2 text-sm">
            <li
              v-for="(e, i) in auditEntriesDisplay"
              :key="`${String((e as Record<string, unknown>).id)}-${i}`"
              class="rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs"
            >
              <div class="flex flex-wrap gap-x-2 text-slate-600">
                <span class="font-medium text-slate-800">{{ String((e as Record<string, unknown>).action || '') }}</span>
                <span>{{ (e as Record<string, unknown>).field_name }}</span>
                <span class="text-slate-400">{{ formatShort(String((e as Record<string, unknown>).created_at || '')) }}</span>
              </div>
            </li>
          </ul>
          <p v-if="!auditEntriesDisplay.length" class="text-sm text-slate-500">Записей пока нет.</p>
        </section>
      </template>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import {
  getOrganizations,
  getOrganizationsByIdAuditLog,
  getOrganizationsByIdDashboard,
  getOrganizationsByIdWeather,
  patchOrganizationsByIdSeasonTargets,
} from '@/api';
import { keycloak } from '@/auth/keycloak';
import DashboardNdviChart from '@/components/dashboard/DashboardNdviChart.vue';
import MainLayout from '@/components/layout/MainLayout.vue';
import { datePresetLastMonth, datePresetLast30Days, downloadFieldExport } from '@/lib/fieldExport';
import { pushToast } from '@/lib/toastBus';
import { useCurrentOrgStore } from '@/store/currentOrg';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { storeToRefs } from 'pinia';
import { MapPinned, Sprout, Users, Zap } from 'lucide-vue-next';
import { computed, reactive, ref, watch } from 'vue';

const { currentOrgId } = storeToRefs(useCurrentOrgStore());
const queryClient = useQueryClient();
const showFullAudit = ref(false);

const orgsQuery = useQuery({
  queryKey: ['organizations'],
  queryFn: () => getOrganizations(),
});

const currentOrgName = computed(() => {
  const id = currentOrgId.value;
  if (!id) return '';
  const list = orgsQuery.data.value?.data?.organizations ?? [];
  const o = list.find((x) => x.id === id);
  return o?.name ?? id;
});

const greeting = computed(() => {
  const u =
    (keycloak.tokenParsed as { preferred_username?: string; name?: string } | undefined)
      ?.preferred_username ||
    (keycloak.tokenParsed as { name?: string } | undefined)?.name;
  if (!u) return '';
  return `Здравствуйте, ${u}.`;
});

const dashboardQuery = useQuery({
  queryKey: ['orgDashboard', currentOrgId],
  queryFn: () => getOrganizationsByIdDashboard({ path: { id: currentOrgId.value! } }),
  enabled: computed(() => !!currentOrgId.value),
  refetchInterval: 15000,
});

const weatherQuery = useQuery({
  queryKey: ['orgWeather', currentOrgId],
  queryFn: () => getOrganizationsByIdWeather({ path: { id: currentOrgId.value! } }),
  enabled: computed(() => !!currentOrgId.value),
  refetchInterval: 600_000,
  retry: 1,
});

const auditFullQuery = useQuery({
  queryKey: ['orgAuditLog', currentOrgId],
  queryFn: () => getOrganizationsByIdAuditLog({ path: { id: currentOrgId.value! }, query: { limit: 120 } }),
  enabled: computed(() => !!currentOrgId.value && showFullAudit.value),
});

const dash = computed(() => dashboardQuery.data.value?.data as Record<string, unknown> | undefined);

const stats = computed(() => dash.value?.stats as Record<string, unknown> | undefined);

const ndviWeekly = computed(
  () => (dash.value?.ndvi_weekly as Array<{ week_start?: string; ndvi_mean_avg?: number }>) ?? [],
);

const targetsProgress = computed(
  () => dash.value?.targets_progress as Record<string, unknown> | undefined,
);

const tpNdviLine = computed(() => {
  const tp = targetsProgress.value;
  if (!tp) return null;
  const target = num(tp.ndvi_target);
  const latest = num(tp.latest_ndvi_avg);
  if (target == null || latest == null) return null;
  return {
    target,
    latest,
    meets: Boolean(tp.meets_ndvi),
  };
});

const staleFields = computed(
  () =>
    (dash.value?.stale_fields as Array<{ field_id?: string; name?: string; tile_count?: number }>) ?? [],
);

const quickFields = computed(
  () => (dash.value?.quick_fields as Array<{ id?: string; name?: string }>) ?? [],
);

const runningRuns = computed(
  () => (dash.value?.workflow_running as Array<Record<string, unknown>>) ?? [],
);

const failedRuns = computed(
  () => (dash.value?.workflow_failed as Array<Record<string, unknown>>) ?? [],
);

const recentAudit = computed(
  () => (dash.value?.recent_audit as Array<Record<string, unknown>>) ?? [],
);

const auditEntriesDisplay = computed(() => {
  if (showFullAudit.value && auditFullQuery.data.value?.data?.entries?.length) {
    return auditFullQuery.data.value.data.entries as Array<Record<string, unknown>>;
  }
  return recentAudit.value;
});

const seasonTargetsObj = computed(() => dash.value?.season_targets as Record<string, unknown> | undefined);

const targetsForm = reactive({
  ndvi_target: undefined as number | undefined,
  health_score_target: undefined as number | undefined,
  notes: '',
});

watch(
  seasonTargetsObj,
  (st) => {
    if (!st || typeof st !== 'object') return;
    const n = num(st.ndvi_target);
    const h = num(st.health_score_target);
    targetsForm.ndvi_target = n ?? undefined;
    targetsForm.health_score_target = h ?? undefined;
    targetsForm.notes = typeof st.notes === 'string' ? st.notes : '';
  },
  { immediate: true },
);

const seasonPatch = useMutation({
  mutationFn: async () => {
    const id = currentOrgId.value!;
    const body: Record<string, unknown> = {};
    if (targetsForm.ndvi_target != null && !Number.isNaN(targetsForm.ndvi_target)) {
      body.ndvi_target = targetsForm.ndvi_target;
    }
    if (targetsForm.health_score_target != null && !Number.isNaN(targetsForm.health_score_target)) {
      body.health_score_target = targetsForm.health_score_target;
    }
    body.notes = targetsForm.notes;
    return patchOrganizationsByIdSeasonTargets({ path: { id }, body });
  },
  onSuccess: () => {
    pushToast('Цели сезона сохранены');
    void queryClient.invalidateQueries({ queryKey: ['orgDashboard', currentOrgId] });
  },
  onError: (e: Error) => {
    pushToast(e?.message || 'Не удалось сохранить (нужна роль manager+)', 7000);
  },
});

function saveSeasonTargets() {
  seasonPatch.mutate();
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

const weatherCurrent = computed(() => {
  const d = weatherQuery.data.value?.data as Record<string, unknown> | undefined;
  const fc = d?.forecast as Record<string, unknown> | undefined;
  const cur = fc?.current as Record<string, unknown> | undefined;
  if (!cur) return null;
  return {
    temp: cur.temperature_2m as number | undefined,
    humidity: cur.relative_humidity_2m as number | undefined,
    wind: cur.wind_speed_10m as number | undefined,
  };
});

const kpiCards = computed(() => {
  const s = stats.value;
  const fc = Number(s?.field_count ?? 0);
  const area = Number(s?.total_area_ha ?? 0);
  const fa = Number(s?.fields_with_observed_analytics ?? 0);
  const mc = Number(s?.member_count ?? 0);
  return [
    {
      key: 'fields',
      label: 'Поля',
      value: String(fc),
      hint: `${fa} с наблюдаемой аналитикой`,
      icon: MapPinned,
    },
    {
      key: 'area',
      label: 'Площадь',
      value: fc > 0 && area > 0 ? `${area.toFixed(1)} га` : '—',
      hint: fc > 0 ? 'Сумма по полям' : '',
      icon: Sprout,
    },
    {
      key: 'runs',
      label: 'В работе',
      value: String(runningRuns.value.length),
      hint: 'Temporal',
      icon: Zap,
    },
    {
      key: 'team',
      label: 'Участники',
      value: String(mc),
      hint: 'В организации',
      icon: Users,
    },
  ];
});

const formatShort = (iso: string) => {
  try {
    return new Intl.DateTimeFormat(navigator.language, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

async function doExport(
  fieldId: string,
  format: 'csv' | 'geojson',
  kind: 'analytics' | 'tiles',
  range?: { dateFrom: string; dateTo: string },
) {
  const r = await downloadFieldExport({
    fieldId,
    format,
    kind,
    dateFrom: range?.dateFrom,
    dateTo: range?.dateTo,
  });
  if (!r.ok) pushToast(r.error || 'Ошибка экспорта', 6000);
}
</script>
