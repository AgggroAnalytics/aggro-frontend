<template>
  <div class="grid grid-cols-[0.2fr_1fr] border border-neutral-400 rounded-sm p-1 bg-neutral-50">
    <canvas ref="_canvasRef" class="row-span-full" />
    <div class="flex flex-col">
      <span class="text-lg font-semibold">
        {{ field.name }}
      </span>
      <span class="text-sm text-neutral-700">
        Создано {{ formattedDate }}
      </span>
      <span class="text-sm text-neutral-700">
        {{ field.area_hectares?.toFixed(2) }} Га
      </span>
    </div>
    <div />
    <div class="flex items-center gap-1">
      <Button variant="outline" @click="emit('fitTo')">
        <MapPin />
      </Button>
      <Button variant="outline" @click="emit('enter')">
        <SquareArrowRightEnter />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldListItem } from '@/api';
import { useGeoPolygonCanvas } from '@/composables/useGeoPolygonCanvas';
import { computed } from 'vue';
import Button from '../ui/button/Button.vue';
import { MapPin, SquareArrowRightEnter } from 'lucide-vue-next';

const lang = navigator.language

const formatter = Intl.DateTimeFormat(lang)

const props = defineProps<{
  field: FieldListItem
}>()


const polygon = computed(() => {
  return (props.field.coordinates ?? []) as [number, number][][]
})

const formattedDate = computed(() => {
  return formatter.format(new Date(props.field.created_at!))
})

const { canvasRef: _canvasRef } = useGeoPolygonCanvas(polygon, {
  width: 80,
  height: 80,
  padding: 6,
  fillStyle: '#86efac',
  strokeStyle: '#166534',
  backgroundColor: 'transparent',
})

const emit = defineEmits(["fitTo", "enter"])
</script>
