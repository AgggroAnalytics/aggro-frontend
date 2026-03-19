<template>
  <div class="grid grid-cols-[0.2fr_0.8fr] border border-neutral-400 rounded-sm p-4">
    <canvas ref="_canvasRef" />
    <div class="">
      {{ field.name }}
    </div>
    <div class="col-span-full">

      <Button @click="emit('fitTo', field.id!)">Перейти</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldListItem } from '@/api';
import Button from '../ui/button/Button.vue';
import { useGeoPolygonCanvas } from '@/composables/useGeoPolygonCanvas';
import { computed } from 'vue';


const props = defineProps<{
  field: FieldListItem
}>()

const polygon = computed(() => {
  return (props.field.coordinates ?? []) as [number, number][][]
})

const { canvasRef: _canvasRef } = useGeoPolygonCanvas(polygon, {
  width: 80,
  height: 80,
  padding: 6,
  fillStyle: '#86efac',
  strokeStyle: '#166534',
  backgroundColor: 'white',
})

const emit = defineEmits(["fitTo"])
</script>
