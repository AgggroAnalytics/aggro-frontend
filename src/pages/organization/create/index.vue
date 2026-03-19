<template>
  <MainLayout>
    <div class="w-full h-full flex justify-center items-center">
      <div class="w-md flex justify-center items-start flex-col">
        <h1 class="text-2xl font-semibold mb-2">Новая организация</h1>
        <form @submit.prevent="() => createOrg.mutate()">
          <Input v-model="orgName" class="mb-1" placeholder="Название организации" />
          <Button :disabled="!canSubmit">Создать</Button>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { postOrganizations } from '@/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/ui/button/Button.vue';
import Input from '@/components/ui/input/Input.vue';
import { useCurrentOrgStore } from '@/store/currentOrg';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const orgName = ref("")

const canSubmit = computed(() => {
  return orgName.value.length !== 0
})

const currentOrgStore = useCurrentOrgStore()
const { currentOrgId } = storeToRefs(currentOrgStore)
const router = useRouter()


const createOrg = useMutation({
  mutationFn: async () => {
    return await postOrganizations({ body: { name: orgName.value } })
  },
  onSettled(data) {
    client.invalidateQueries({ queryKey: ["organizations"] })
    currentOrgId.value = data?.data?.id
    router.push("/fields")
  }
})

const client = useQueryClient()

</script>
