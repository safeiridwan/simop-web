<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    accept?: string
    allowedTypes?: string[]
    maxBytes?: number
    disabled?: boolean
    fileName?: string | null
  }>(),
  {
    label: 'Seret & lepas berkas di sini, atau klik untuk memilih',
    accept: '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv,image/*',
    maxBytes: 10 * 1024 * 1024,
    allowedTypes: () => [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    disabled: false,
    fileName: null,
  },
)

const emit = defineEmits<{ 'update:file': [file: File | null] }>()

const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const error = ref<string | null>(null)
const selected = ref<string | null>(props.fileName ?? null)

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validate(file: File): string | null {
  if (props.allowedTypes.length > 0 && file.type && !props.allowedTypes.includes(file.type)) {
    return 'Tipe berkas tidak diizinkan.'
  }
  if (file.size > props.maxBytes) {
    return `Ukuran berkas melebihi batas ${formatBytes(props.maxBytes)}.`
  }
  return null
}

function choose(file: File | null) {
  error.value = null
  if (!file) {
    selected.value = null
    emit('update:file', null)
    return
  }
  const problem = validate(file)
  if (problem) {
    error.value = problem
    selected.value = null
    emit('update:file', null)
    return
  }
  selected.value = file.name
  emit('update:file', file)
}

function onInput(event: Event) {
  choose((event.target as HTMLInputElement).files?.[0] ?? null)
}

function onDrop(event: DragEvent) {
  dragging.value = false
  if (props.disabled) return
  choose(event.dataTransfer?.files?.[0] ?? null)
}

function onDragOver() {
  if (!props.disabled) dragging.value = true
}
</script>

<template>
  <div>
    <div
      class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition"
      :class="[
        dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50',
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-brand-500',
      ]"
      @click="!disabled && input?.click()"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <p class="text-slate-600">{{ label }}</p>
      <p v-if="selected" class="mt-1 font-medium text-slate-900">{{ selected }}</p>
      <p v-else class="mt-1 text-xs text-slate-400">Belum ada berkas dipilih.</p>
      <p class="mt-2 text-xs text-slate-400">PDF, gambar, dokumen Office, teks. Maksimal {{ formatBytes(maxBytes) }}.</p>
    </div>
    <input ref="input" type="file" class="hidden" :accept="accept" :disabled="disabled" @change="onInput" />
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
