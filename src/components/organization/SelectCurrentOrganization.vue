<script setup lang="ts">
import { getOrganizations } from '@/api';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrentOrgStore } from '@/store/currentOrg';
import { useQuery } from '@tanstack/vue-query';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const orgsQuery = useQuery({
  queryKey: ["organizations"],
  queryFn: async () => {
    return await getOrganizations()
  }
})

const orgs = computed(() => {
  return orgsQuery.data.value?.data?.organizations ?? []
})

const currOrgStore = useCurrentOrgStore();

const { currentOrgId } = storeToRefs(currOrgStore)

</script>

<template>
  <div class="flex items-center gap-2">
    <span class="hidden text-xs text-slate-500 sm:inline">Организация</span>
    <Select v-model="currentOrgId">
      <SelectTrigger class="w-45 min-w-[10rem]">
        <SelectValue placeholder="Выберите организацию" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem v-for="org in orgs" :value="org.id!">
            {{ org.name! }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>
