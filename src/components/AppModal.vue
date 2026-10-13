<script setup lang="ts">
defineProps<{ open: boolean; title?: string; message: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" role="dialog" aria-modal="true">
        <h2 class="text-lg font-semibold text-slate-900">{{ title ?? 'Pemberitahuan' }}</h2>
        <p class="mt-2 text-sm text-slate-600">{{ message }}</p>
        <div class="mt-4 flex justify-end">
          <button
            type="button"
            class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
            @click="emit('close')"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
