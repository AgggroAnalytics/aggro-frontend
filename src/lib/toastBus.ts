import { ref } from 'vue';

export const toastMessage = ref<string | null>(null);

export function pushToast(msg: string, ms = 5000) {
  toastMessage.value = msg;
  window.setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = null;
    }
  }, ms);
}
