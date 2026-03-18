<script setup lang="ts">
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import SelectCurrentOrganization from '../organization/SelectCurrentOrganization.vue';
import Sidebar from './Sidebar.vue';
</script>

<template>
  <SidebarProvider>
    <Sidebar />
    <SidebarInset>
      <header class="px-4 py-1 border-y flex justify-between items-center">
        <SidebarTrigger class="-ml-1" />
        <div>
          <SelectCurrentOrganization />
        </div>
      </header>
      <main class="py-1 px-4 w-full h-full grid grid-cols-1">
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
