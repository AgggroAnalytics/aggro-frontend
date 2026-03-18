import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { initKeycloak } from './auth/keycloak';
import { configureApiClient } from './lib/apiClient';
import "maplibre-gl/dist/maplibre-gl.css";

import { VueQueryPlugin } from '@tanstack/vue-query'
import { router } from './router';
import { createPinia } from 'pinia';
async function bootstrap() {
  const mode = import.meta.env.VITE_KEYCLOAK_ONLOAD === 'login-required' ? 'login-required' : 'check-sso';
  await initKeycloak(mode);
  configureApiClient();

  const pinia = createPinia()

  const app = createApp(App);
  app.use(pinia)
  app.use(router)
  app.use(VueQueryPlugin)
  app.mount('#app');
}

bootstrap().catch((e) => {
  console.error(e);
  document.body.innerHTML = `<p style="padding:2rem">Auth init failed: ${String(e)}</p>`;
});
