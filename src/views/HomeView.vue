<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { keycloak } from '../auth/keycloak';
import { getOrganizations } from '../api/sdk.gen';
import { useQuery } from '@tanstack/vue-query';

const username = computed(() => keycloak.tokenParsed?.preferred_username ?? keycloak.subject ?? '—');
const loadError = ref<string | null>(null);

const orgsQuery = useQuery({
  queryKey: ["orgs"],
  queryFn: async () => {
    return (await getOrganizations()).data
  },
})

const orgs = computed(() => {
  return orgsQuery.data.value?.organizations ?? []
})

</script>

<template>
  <div class="home">
    <header class="w-screen flex flex-row justify-end">
      <span>{{ username }}</span>
      <button type="button" @click="keycloak.logout()">Logout</button>
    </header>
    <p v-if="loadError" class="err">{{ loadError }}</p>
    <ul v-else>
      <li v-for="(o, i) in orgs" :key="o.id ?? i">{{ o.name }}</li>
    </ul>
  </div>
</template>
