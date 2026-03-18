<template>
  <form @submit="submit">
    <Input placeholder="Название поля" />
    <Button type="button" @click="draw">Рисовать</Button>
    <Button type="submit">Создать</Button>
  </form>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue';
import { mapKey } from '../layout/map.inject';
import Input from '../ui/input/Input.vue';
import { useMapDraw } from '@/composables/useMapDraw';
import Button from '../ui/button/Button.vue';
const map = inject(mapKey)
const { start, destroy } = useMapDraw(map!.map)

const geom = ref<number[][][]>()

const draw = () => {
  start({ addControl: true, mode: 'draw_polygon' }).then((res) => {
    geom.value = res.geometry.coordinates as number[][][]
  })
}

const fieldName = ref("")


const emit = defineEmits<{
  fieldCreated: [geometry: number[][][], name: string]
}>()

const submit = () => {
  destroy()
  if (!geom.value?.length) return
  emit("fieldCreated", geom.value, fieldName.value)
}
</script>
