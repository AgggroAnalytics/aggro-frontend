<script setup lang="ts">

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useCurrentOrgStore } from '@/store/currentOrg';
import { GalleryVerticalEnd } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';


const currentOrgStore = useCurrentOrgStore()
const { currentOrgId } = storeToRefs(currentOrgStore)

</script>
<template>
  <Sidebar collapsible="offcanvas" variant="sidebar">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div
              class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <GalleryVerticalEnd class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">CPV</span>
              <span class="truncate text-xs">Сельхозземли · космоснимки</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Платформа</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/">
                  <span>Обзор</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/organization">
                  <span>Организации</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="currentOrgId">
              <SidebarMenuButton as-child>
                <RouterLink to="/organization/members">
                  <span>Участники</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="currentOrgId">
              <SidebarMenuButton as-child>
                <RouterLink to="/jobs">
                  <span>Задачи</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="currentOrgId">
              <SidebarMenuButton as-child>
                <RouterLink to="/fields">
                  <span>Поля</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/me/profile">
                  <span>Профиль</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/me/settings">
                  <span>Настройки</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <RouterLink to="/me/security">
                  <span>Безопасность</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter />
    <SidebarRail />
  </Sidebar>
</template>
