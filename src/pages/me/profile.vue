<template>
  <MainLayout>
    <div class="mx-auto max-w-lg space-y-6 py-4">
      <h1 class="text-xl font-semibold text-slate-900">Профиль</h1>
      <div v-if="meQuery.isPending.value" class="text-sm text-slate-500">Загрузка…</div>
      <div v-else class="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
        <div>
          <label class="text-xs text-slate-600">Email (только чтение)</label>
          <p class="text-sm font-medium">{{ profile?.email || '—' }}</p>
        </div>
        <div>
          <label class="text-xs text-slate-600">Имя / фамилия (из IdP)</label>
          <p class="text-sm">{{ profile?.given_name }} {{ profile?.family_name }}</p>
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600">URL аватара</label>
          <input v-model="avatarUrl" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <Button :disabled="saveMutation.isPending.value" @click="saveAvatar">Сохранить аватар</Button>
        <p v-if="realmRoles?.length" class="text-xs text-slate-500">
          Роли в токене Keycloak: {{ realmRoles.join(', ') }}
        </p>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { getUsersMe, patchUsersMePreferences } from '@/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';

const meQuery = useQuery({
  queryKey: ['usersMe'],
  queryFn: () => getUsersMe(),
});

const profile = computed(() => meQuery.data.value?.data as Record<string, unknown> | undefined);
const realmRoles = computed(() => (profile.value?.realm_roles as string[] | undefined) ?? []);

const avatarUrl = ref('');
watch(
  profile,
  (p) => {
    if (p && typeof p.avatar_url === 'string') {
      avatarUrl.value = p.avatar_url;
    }
  },
  { immediate: true },
);

const queryClient = useQueryClient();
const saveMutation = useMutation({
  mutationFn: async () => {
    await patchUsersMePreferences({ body: { avatar_url: avatarUrl.value } });
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usersMe'] }),
});

function saveAvatar() {
  saveMutation.mutate();
}
</script>
