<template>
  <MainLayout>
    <div class="mx-auto max-w-xl space-y-6 py-4">
      <div v-if="orgsQuery.isPending.value" class="text-sm text-slate-500">Загрузка организаций…</div>
      <NoOrganizations v-else-if="!orgs.length" @create-org="router.push('/organization/create')" />
      <div v-else class="space-y-4">
        <h1 class="text-xl font-semibold text-slate-900">Организации</h1>
        <ul class="divide-y rounded-xl border bg-white shadow-sm">
          <li
            v-for="o in orgs"
            :key="o.id"
            class="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
          >
            <span class="font-medium text-slate-800">{{ o.name }}</span>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" @click="setOrgAndMembers(o.id!)">Участники</Button>
            </div>
          </li>
        </ul>
        <Button variant="secondary" @click="router.push('/organization/create')">Создать организацию</Button>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { getOrganizations } from '@/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import NoOrganizations from '@/components/organization/NoOrganizations.vue';
import { Button } from '@/components/ui/button';
import { useCurrentOrgStore } from '@/store/currentOrg';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentOrgStore = useCurrentOrgStore();

const orgsQuery = useQuery({
  queryKey: ['organizations'],
  queryFn: () => getOrganizations(),
});

const orgs = computed(() => orgsQuery.data.value?.data?.organizations ?? []);

function setOrgAndMembers(id: string) {
  currentOrgStore.currentOrgId = id;
  router.push('/organization/members');
}
</script>
