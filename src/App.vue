<script setup lang="ts">
import { RouterView } from 'vue-router';
import { toastMessage } from '@/lib/toastBus';
</script>

<template>
  <RouterView />
  <div
    v-if="toastMessage"
    role="status"
    class="fixed bottom-4 right-4 z-[100] max-w-sm rounded-lg border border-slate-200 bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
  >
    {{ toastMessage }}
  </div>
</template>
