<template>

  <div class="h-full w-full">
    <div class="w-full">
      <div>
        <NewFieldForm @fieldCreated="(coords, name) => createField.mutate({
          name: name,
          coordinates: coords,
          orgID: currentOrgId!
        })" />
      </div>

      <Separator class="my-4" />
      <div v-if="fields.length">
        <h2>Поля</h2>
        <div v-for="field in fields">
          <FieldCard :field="field" @fitTo="fitTo(field.id!)" />
        </div>
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { getFields, postFields } from '@/api';
import NewFieldForm from './NewFieldForm.vue';
import { Button } from '../ui/button';
import FieldCard from './FieldCard.vue';
import Separator from '../ui/separator/Separator.vue';


const currentOrganizatonStore = useCurrentOrgStore()
const { currentOrgId } = storeToRefs(currentOrganizatonStore)

const queryClient = useQueryClient()

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
  },
  onSettled(_data, _err, req) {
    queryClient.invalidateQueries({ queryKey: ["organization_fields", req.orgID] })
  }
})


</script>
