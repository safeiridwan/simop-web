<script setup lang="ts">
import { ref } from 'vue'

import FileDropzone from '@/components/FileDropzone.vue'
import { downloadFile } from '@/services/http'

export interface ImportRowError {
  row: number
  message: string
}

export interface ImportSummary {
  created: number
  skipped: number
  errors: ImportRowError[]
  notices?: string[]
}

const props = withDefaults(
  defineProps<{
    templatePath: string
    templateFilename: string
    busy?: boolean
    result?: ImportSummary | null
    error?: string | null
  }>(),
  { busy: false, result: null, error: null },
)

const emit = defineEmits<{ import: [file: File] }>()

const file = ref<File | null>(null)

async function download(format: 'xlsx' | 'csv') {
  const name = `${props.templateFilename}.${format}`
  await downloadFile(`${props.templatePath}?format=${format}`, name)
}

function submit() {
  if (file.value) emit('import', file.value)
}
</script>

<template>
  <div class="mb-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <span class="text-slate-500">Unduh template:</span>
      <button type="button" class="text-brand-600 hover:underline" @click="download('xlsx')">XLSX</button>
      <button type="button" class="text-brand-600 hover:underline" @click="download('csv')">CSV</button>
    </div>

    <FileDropzone
      label="Seret & lepas berkas .xlsx atau .csv di sini, atau klik untuk memilih"
      accept=".xlsx,.csv"
      :allowed-types="[
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/vnd.ms-excel',
      ]"
      @update:file="file = $event"
    />

    <p v-if="error" class="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <button
      type="button"
      :disabled="busy || !file"
      class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
      @click="submit"
    >
      {{ busy ? 'Memproses...' : 'Impor' }}
    </button>

    <div v-if="result" class="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
      <p class="text-slate-700">
        Berhasil: {{ result.created }} baris tersimpan, {{ result.skipped }} baris gagal.
      </p>
      <ul v-if="result.notices?.length" class="mt-2 space-y-1 text-xs text-amber-700">
        <li v-for="(notice, index) in result.notices" :key="index">{{ notice }}</li>
      </ul>
      <ul v-if="result.errors.length" class="mt-2 space-y-1 text-xs text-red-600">
        <li v-for="e in result.errors" :key="e.row">Baris {{ e.row }}: {{ e.message }}</li>
      </ul>
    </div>
  </div>
</template>
