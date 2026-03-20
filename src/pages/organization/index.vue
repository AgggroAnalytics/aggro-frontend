<template>
  <MainLayout>
    <NoOrganizations @create-org="router.push('/organization/create')" />
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/components/layout/MainLayout.vue';
import NoOrganizations from '@/components/organization/NoOrganizations.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

</script>
