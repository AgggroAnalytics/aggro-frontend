<template>

  <div class="h-full w-full">
    <div class="w-full">
      <NewFieldForm @fieldCreated="(coords, name) => createField.mutate({
        name: name,
        coordinates: coords,
        orgID: currentOrgId!
      })" />
      <div v-for="field in fields">
        {{ field.id }}
        <Button @click="fitTo(field.id!)">Перейти</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrentOrgStore } from '@/store/currentOrg';
import { storeToRefs } from 'pinia';
import { computed, inject } from 'vue';
import { mapKey } from '../layout/map.inject';
import { useMapPolygons } from '@/composables/useMapPolygons';
import { useMutation, useQuery } from '@tanstack/vue-query';
import { getFields, postFields } from '@/api';
import NewFieldForm from './NewFieldForm.vue';
import { Button } from '../ui/button';


const currentOrganizatonStore = useCurrentOrgStore()
const { currentOrgId } = storeToRefs(currentOrganizatonStore)

const map = inject(mapKey)

const orgFieldsQuery = useQuery({
  queryKey: ["organization_fields", currentOrgId.value],
  queryFn: async () => {
    return getFields({
      query: {
        organization_id: currentOrgId.value!
      }
    })
  }
})

const fields = computed(() => {
  return orgFieldsQuery.data.value?.data?.fields ?? []
})

const polygons = computed(() => {
  return fields.value.map((f) => ({
    id: f.id!,
    coordinates: f.coordinates!,
  }))
})

const { fitTo } = useMapPolygons(map!.map, polygons)

const createField = useMutation({
  mutationFn: async (params: { name: string, coordinates: number[][][], orgID: string }) => {
    return await postFields({
      body: {
        coordinates: params.coordinates,
        name: params.name,
        description: "",
        organization_id: params.orgID
      }
    })
  }
})

</script>
