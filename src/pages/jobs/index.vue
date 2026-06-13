<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-4 py-4">
      <h1 class="text-xl font-semibold text-slate-900">Центр задач</h1>
      <p class="text-sm text-slate-600">Запуски обработки полей в текущей организации (Temporal).</p>
      <div v-if="!currentOrgId" class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        Выберите организацию в шапке.
      </div>
      <div v-else class="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table class="w-full min-w-[900px] text-sm">
          <thead>
            <tr class="border-b bg-slate-50 text-left text-slate-600">
              <th class="p-2">Поле</th>
              <th class="p-2">Статус</th>
              <th class="p-2">Этап</th>
              <th class="p-2">Начало</th>
              <th class="p-2">Длительность</th>
              <th class="p-2">Ошибка</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in flatRuns" :key="`${row.field_id}-${row.run?.run_id}-${i}`" class="border-b align-top">
              <td class="p-2">
                <RouterLink :to="`/fields/${row.field_id}`" class="text-emerald-700 hover:underline">
                  {{ row.field_name }}
                </RouterLink>
              </td>
              <td class="p-2">{{ row.run?.status }}</td>
              <td class="p-2">{{ row.run?.stage_label }}</td>
              <td class="p-2 text-xs text-slate-600">
                {{ row.run?.started_at ? new Date(row.run.started_at).toLocaleString() : '—' }}
              </td>
              <td class="p-2">
                {{ row.run?.duration_seconds != null ? `${row.run.duration_seconds}s` : '—' }}
              </td>
              <td class="p-2 max-w-xs truncate text-xs text-red-700" :title="row.run?.failure_message ?? ''">
                {{ row.run?.failure_message || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!flatRuns.length && !runsQuery.isPending.value" class="p-4 text-slate-500">Нет запусков.</p>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { getOrganizationsByIdFieldWorkflowRuns } from '@/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import { useCurrentOrgStore } from '@/store/currentOrg';
import { useQuery } from '@tanstack/vue-query';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const { currentOrgId } = storeToRefs(useCurrentOrgStore());

const runsQuery = useQuery({
  queryKey: ['orgWorkflowRuns', currentOrgId],
  queryFn: async () => {
    const id = currentOrgId.value!;
    return getOrganizationsByIdFieldWorkflowRuns({ path: { id } });
  },
  enabled: computed(() => !!currentOrgId.value),
  refetchInterval: 4000,
});

const flatRuns = computed(() => runsQuery.data.value?.data?.runs ?? []);
</script>
