<template>
  <MainLayout>
    <div class="mx-auto max-w-4xl space-y-6 py-4">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Участники организации</h1>
        <p class="text-sm text-slate-600">Текущий контекст: выбранная в шапке организация.</p>
      </div>
      <div v-if="!currentOrgId" class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Выберите организацию в шапке.
      </div>
      <template v-else>
        <div class="rounded-xl border bg-white p-4 shadow-sm">
          <h2 class="mb-3 text-sm font-medium text-slate-800">Пригласить по email</h2>
          <div class="flex flex-wrap items-end gap-2">
            <div class="min-w-[200px] flex-1">
              <label class="mb-1 block text-xs text-slate-600">Email</label>
              <input
                v-model="inviteEmail"
                type="email"
                class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="user@example.com"
              />
            </div>
            <div class="w-36">
              <label class="mb-1 block text-xs text-slate-600">Роль</label>
              <Select v-model="inviteRole">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">viewer</SelectItem>
                  <SelectItem value="farmer">farmer</SelectItem>
                  <SelectItem value="manager">manager</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button :disabled="!inviteEmail || inviteMutation.isPending.value" @click="submitInvite">
              Пригласить
            </Button>
          </div>
          <p v-if="inviteError" class="mt-2 text-sm text-red-600">{{ inviteError }}</p>
        </div>
        <div class="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b bg-slate-50 text-left text-slate-600">
                <th class="p-3">Пользователь</th>
                <th class="p-3">Email</th>
                <th class="p-3">Роль</th>
                <th class="p-3 w-32" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in members" :key="m.user_id" class="border-b">
                <td class="p-3">{{ m.first_name }} {{ m.last_name }} ({{ m.username }})</td>
                <td class="p-3">{{ m.email }}</td>
                <td class="p-3">
                  <Select
                    :model-value="m.role"
                    @update:model-value="(v) => v && patchRole(m.user_id!, String(v))"
                  >
                    <SelectTrigger class="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">viewer</SelectItem>
                      <SelectItem value="farmer">farmer</SelectItem>
                      <SelectItem value="manager">manager</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td class="p-3">
                  <Button variant="outline" size="sm" @click="removeMember(m.user_id!)">Исключить</Button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="!members.length && !membersQuery.isPending.value" class="p-4 text-sm text-slate-500">
            Нет участников (или нет доступа).
          </p>
        </div>
      </template>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import {
  getOrganizationsByIdMembers,
  postOrganizationsByIdInvite,
  patchOrganizationsByIdMembersByUserId,
  deleteOrganizationsByIdMembersByUserId,
} from '@/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentOrgStore } from '@/store/currentOrg';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

const currentOrgStore = useCurrentOrgStore();
const { currentOrgId } = storeToRefs(currentOrgStore);
const inviteEmail = ref('');
const inviteRole = ref('viewer');
const inviteError = ref<string | null>(null);
const queryClient = useQueryClient();

const membersQuery = useQuery({
  queryKey: ['orgMembers', currentOrgId],
  queryFn: async () => {
    const id = currentOrgId.value!;
    return getOrganizationsByIdMembers({ path: { id } });
  },
  enabled: computed(() => !!currentOrgId.value),
});

const members = computed(() => membersQuery.data.value?.data?.members ?? []);

const inviteMutation = useMutation({
  mutationFn: async () => {
    const id = currentOrgId.value!;
    return postOrganizationsByIdInvite({
      path: { id },
      body: { email: inviteEmail.value.trim(), role: inviteRole.value as 'admin' | 'farmer' | 'manager' | 'viewer' },
    });
  },
  onSuccess: () => {
    inviteError.value = null;
    inviteEmail.value = '';
    queryClient.invalidateQueries({ queryKey: ['orgMembers', currentOrgId] });
  },
  onError: (e: unknown) => {
    inviteError.value = e instanceof Error ? e.message : 'Ошибка приглашения';
  },
});

function submitInvite() {
  inviteError.value = null;
  inviteMutation.mutate();
}

async function patchRole(userId: string, role: string) {
  const id = currentOrgId.value!;
  await patchOrganizationsByIdMembersByUserId({
    path: { id, userId },
    body: { role: role as 'admin' | 'farmer' | 'manager' | 'viewer' },
  });
  queryClient.invalidateQueries({ queryKey: ['orgMembers', currentOrgId] });
}

async function removeMember(userId: string) {
  if (!confirm('Исключить пользователя из организации?')) return;
  const id = currentOrgId.value!;
  await deleteOrganizationsByIdMembersByUserId({ path: { id, userId } });
  queryClient.invalidateQueries({ queryKey: ['orgMembers', currentOrgId] });
}
</script>
