<template>
  <MainLayout>
    <div class="mx-auto max-w-lg space-y-6 py-4">
      <h1 class="text-xl font-semibold text-slate-900">Настройки приложения</h1>
      <div class="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
        <div>
          <label class="mb-1 block text-xs text-slate-600">Язык (locale)</label>
          <input v-model="locale" class="w-full rounded-md border px-3 py-2 text-sm" placeholder="ru" />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600">Часовой пояс</label>
          <input v-model="timezone" class="w-full rounded-md border px-3 py-2 text-sm" placeholder="Europe/Moscow" />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600">Единицы</label>
          <Select v-model="units">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">metric</SelectItem>
              <SelectItem value="imperial">imperial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600">Формат дат</label>
          <input v-model="dateFormat" class="w-full rounded-md border px-3 py-2 text-sm" placeholder="dmy" />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600">Год по умолчанию для списков полей</label>
          <input v-model.number="fieldsYear" type="number" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <Button :disabled="mutation.isPending.value" @click="save">Сохранить</Button>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { getUsersMe, patchUsersMePreferences } from '@/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';

const meQuery = useQuery({
  queryKey: ['usersMe'],
  queryFn: () => getUsersMe(),
});

const p = computed(() => meQuery.data.value?.data as Record<string, unknown> | undefined);
const locale = ref('ru');
const timezone = ref('UTC');
const units = ref<'metric' | 'imperial'>('metric');
const dateFormat = ref('dmy');
const fieldsYear = ref<number | null>(null);

watch(
  p,
  (v) => {
    if (!v) return;
    if (typeof v.locale === 'string') locale.value = v.locale;
    if (typeof v.timezone === 'string') timezone.value = v.timezone;
    if (v.units_system === 'imperial' || v.units_system === 'metric') units.value = v.units_system;
    if (typeof v.date_format === 'string') dateFormat.value = v.date_format;
    if (typeof v.fields_default_year === 'number') fieldsYear.value = v.fields_default_year;
  },
  { immediate: true },
);

const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: async () => {
    await patchUsersMePreferences({
      body: {
        locale: locale.value,
        timezone: timezone.value,
        units_system: units.value,
        date_format: dateFormat.value,
        fields_default_year: fieldsYear.value ?? null,
      },
    });
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usersMe'] }),
});

function save() {
  mutation.mutate();
}
</script>
