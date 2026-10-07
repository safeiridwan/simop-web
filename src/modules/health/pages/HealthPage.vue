<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useHealthStore } from '@/app/stores/health'

const store = useHealthStore()
const { status } = storeToRefs(store)

onMounted(() => {
  void store.check()
})
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50">
    <div class="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 class="text-xl font-semibold text-slate-900">Status API</h1>
      <p class="mt-4 text-sm text-slate-600">
        Status:
        <span data-testid="status" class="font-medium">{{ status }}</span>
      </p>
      <button
        type="button"
        class="mt-6 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        @click="store.check()"
      >
        Periksa ulang
      </button>
    </div>
  </main>
</template>
