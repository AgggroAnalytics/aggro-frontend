<script setup lang="ts">
import { FolderOpen } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

const emit = defineEmits(["create-org"])
</script>

<template>
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <FolderOpen />
      </EmptyMedia>
    </EmptyHeader>
    <EmptyTitle>Нет организаций</EmptyTitle>
    <EmptyDescription>Вы не состоите ни в одной организации</EmptyDescription>
    <EmptyContent>
      <Button @click="emit('create-org')">Создать организацию</Button>
    </EmptyContent>
  </Empty>
</template>
