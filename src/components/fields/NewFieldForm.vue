<template>
  <form @submit.prevent="submit" class="flex flex-col gap-1">
    <Input v-model="fieldName" placeholder="Название поля" />
    <div class="flex flex-row gap-2">
      <Button type="button" variant="secondary" @click="draw">
        <Paintbrush />
      </Button>
      <Button type="submit" variant="default" :disabled="!canSubmit">Создать</Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { mapKey } from '../layout/map.inject';
import Input from '../ui/input/Input.vue';
import { useMapDraw } from '@/composables/useMapDraw';
import Button from '../ui/button/Button.vue';
import { Paintbrush } from 'lucide-vue-next';
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

const canSubmit = computed(() => {
  return !!geom.value?.length && !!fieldName.value.length
})

const submit = () => {
  destroy()
  if (!geom.value?.length) return
  emit("fieldCreated", geom.value, fieldName.value)
}
</script>
