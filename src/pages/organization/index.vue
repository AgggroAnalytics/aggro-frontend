<template>
  <MainLayout>
    <NoOrganizations @create-org="router.push('/organization/create')" />
  </MainLayout>
</template>

<script setup lang="ts">
import { getOrganizations } from '@/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import NoOrganizations from '@/components/organization/NoOrganizations.vue';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const orgQuery = useQuery({
  queryKey: ["organizations"],
  queryFn: async () => {
    return await getOrganizations()
  }
})

const router = useRouter()

const organizations = computed(() => {
  return orgQuery.data.value?.data?.organizations ?? []
})


</script>
