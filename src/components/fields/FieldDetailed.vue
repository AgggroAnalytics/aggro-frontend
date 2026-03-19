<template>
  <div>

  </div>
</template>

<script setup lang="ts">
import { getFieldsById } from '@/api';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute("/fields/[id]")

const fieldId = computed(() => {
  return route.params.id
})

const currentFieldQuery = useQuery({
  queryKey: ["fieldDetailed", fieldId.value],
  queryFn: (queryKey) => {
    const fieldId = queryKey.queryKey[1]
    return getFieldsById({
      path: {
        id: fieldId
      }
    })
  }
})

const currentField = computed(() => {
  return currentFieldQuery.data.value?.data
})

</script>
