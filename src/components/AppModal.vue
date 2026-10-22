<script setup lang="ts">
withDefaults(
  defineProps<{ open: boolean; title?: string; message: string; variant?: 'alert' | 'confirm'; confirmLabel?: string }>(),
  { variant: 'alert', confirmLabel: 'Ya, Hapus' },
)
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" role="dialog" aria-modal="true">
        <h2 class="text-lg font-semibold text-slate-900">
          {{ title ?? (variant === 'confirm' ? 'Konfirmasi' : 'Pemberitahuan') }}
        </h2>
        <div class="mt-2 text-sm text-slate-600">
          <slot>{{ message }}</slot>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            v-if="variant === 'confirm'"
            type="button"
            class="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            @click="emit('close')"
          >
            Batal
          </button>
          <button
            v-if="variant === 'confirm'"
            type="button"
            class="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </button>
          <button
            v-else
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
