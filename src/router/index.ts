import { createRouter, createWebHistory } from 'vue-router';
import { keycloak } from '../auth/keycloak';
import { routes } from "vue-router/auto-routes"
import { useCurrentOrgStore } from '@/store/currentOrg';
import { getOrganizations } from '@/api';

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.public) {
    if (to.name === '/login' && keycloak.authenticated) {
      return typeof to.query.redirect === 'string' ? to.query.redirect : '/';
    }
    return;
  }
  if (!keycloak.authenticated) {
    if (to.name === '/login') {
      return;
    }
    return { name: '/login', query: { redirect: to.fullPath } };
  }

  const currentOrgStore = useCurrentOrgStore();
  const orgs = await getOrganizations();
  const list = orgs.data?.organizations ?? [];
  const ids = new Set(list.map((o) => o.id).filter(Boolean) as string[]);
  if (currentOrgStore.currentOrgId && !ids.has(currentOrgStore.currentOrgId)) {
    currentOrgStore.currentOrgId = null;
  }
  if (!currentOrgStore.currentOrgId && list.length) {
    currentOrgStore.currentOrgId = list[0].id ?? null;
  }
});
