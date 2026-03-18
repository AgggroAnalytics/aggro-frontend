import { createRouter, createWebHistory } from 'vue-router';
import { keycloak } from '../auth/keycloak';
import { routes } from "vue-router/auto-routes"
import { useCurrentOrgStore } from '@/store/currentOrg';
import { getOrganizations } from '@/api';

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const currentOrgStore = useCurrentOrgStore()
  if (!currentOrgStore.currentOrgId) {
    const orgs = await getOrganizations()
    currentOrgStore.currentOrgId = orgs.data?.organizations?.at(0)?.id
  }
  if (to.meta.public) {
    if (to.name === '/login' && keycloak.authenticated) {
      next(typeof to.query.redirect === 'string' ? to.query.redirect : '/');
      return;
    }
    next();
    return;
  }
  if (!keycloak.authenticated) {
    next({ name: '/login', query: { redirect: to.fullPath } });
    return;
  }
  next();
});
