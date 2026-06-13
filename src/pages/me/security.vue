<template>
  <MainLayout>
    <div class="mx-auto max-w-lg space-y-6 py-4">
      <h1 class="text-xl font-semibold text-slate-900">Безопасность</h1>
      <div class="space-y-3 rounded-xl border bg-white p-4 text-sm shadow-sm text-slate-700">
        <p>
          Смена пароля и управление сессиями выполняются в аккаунте Keycloak (выйти на всех устройствах — в разделе
          безопасности аккаунта).
        </p>
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" @click="openAccount">Открыть аккаунт Keycloak</Button>
          <Button variant="destructive" @click="logoutHere">Выйти здесь</Button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { keycloak } from '@/auth/keycloak';
import MainLayout from '@/components/layout/MainLayout.vue';
import { Button } from '@/components/ui/button';

const { VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM } = import.meta.env;

function openAccount() {
  const base = VITE_KEYCLOAK_URL?.replace(/\/$/, '') ?? '';
  const realm = VITE_KEYCLOAK_REALM ?? '';
  if (!base || !realm) return;
  window.open(`${base}/realms/${realm}/account`, '_blank', 'noopener,noreferrer');
}

function logoutHere() {
  void keycloak.logout({ redirectUri: window.location.origin + (import.meta.env.BASE_URL || '/') });
}
</script>
