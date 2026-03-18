import { defineStore } from "pinia";
import { ref } from "vue";

export const useCurrentOrgStore = defineStore("current-org", () => {
  const currentOrgId = ref<string | null>()
  return { currentOrgId }
})
