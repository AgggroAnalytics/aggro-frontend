import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const ORG_STORAGE_KEY = 'aggro-current-org-id';

function readStoredOrgId(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(ORG_STORAGE_KEY);
}

export const useCurrentOrgStore = defineStore('current-org', () => {
  const currentOrgId = ref<string | null>(readStoredOrgId());

  watch(currentOrgId, (v) => {
    if (typeof localStorage === 'undefined') {
      return;
    }
    if (v) {
      localStorage.setItem(ORG_STORAGE_KEY, v);
    } else {
      localStorage.removeItem(ORG_STORAGE_KEY);
    }
  });

  return { currentOrgId };
});
