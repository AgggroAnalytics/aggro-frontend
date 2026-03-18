<script setup lang="ts">
import { useRoute } from 'vue-router';
import { keycloak } from '../auth/keycloak';

const route = useRoute();

function login() {
  const path = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
  const redirectUri = `${window.location.origin}${path}`;
  void keycloak.login({ redirectUri });
}
</script>

<template>
  <div class="bg-slate-300 h-screen w-screen flex items-center justify-center">
    <div
      class="bg-slate-200 h-fit w-fit drop-shadow-xl rounded-md flex items-center justify-center flex-col px-10 py-5">
      <h1 class="text-4xl font-semibold">AGGRO</h1>
      <p>Система агроаналитики нового поколения</p>
      <button class="bg-amber-600 text-white rounded-md" type="button" @click="login">Войти</button>
    </div>
  </div>
</template>

<style scoped>
.login {
  padding: 2rem;
  text-align: center;
}

button {
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
}
</style>
