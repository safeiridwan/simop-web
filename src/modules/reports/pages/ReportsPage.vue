<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { reportsApi } from '../api'
import { REPORT_KEYS, type Dataset } from '../types'

const route = useRoute()
const router = useRouter()

const activeKey = ref(typeof route.query.report === 'string' ? route.query.report : REPORT_KEYS[0].key)
const dataset = ref<Dataset | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const exporting = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    dataset.value = await reportsApi.get(activeKey.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat laporan'
    dataset.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(activeKey, (key) => {
  void router.replace({ query: { report: key } })
  void load()
})

async function onExport() {
  exporting.value = true
  error.value = null
  try {
    await reportsApi.export(activeKey.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal mengekspor'
  } finally {
    exporting.value = false
  }
}

function labelFor(key: string): string {
  return REPORT_KEYS.find((r) => r.key === key)?.label ?? key
}
</script>

<template>
  <section>
    <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-xl font-semibold text-slate-900">Laporan</h1>
      <button
        type="button"
        :disabled="exporting || !dataset"
        class="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50 sm:w-fit"
        @click="onExport"
      >
        {{ exporting ? 'Mengekspor...' : 'Ekspor CSV' }}
      </button>
    </header>

    <nav class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="r in REPORT_KEYS"
        :key="r.key"
        type="button"
        class="rounded border px-3 py-1.5 text-sm"
        :class="activeKey === r.key ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 text-slate-700'"
        @click="activeKey = r.key"
      >
        {{ r.label }}
      </button>
    </nav>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="!dataset || dataset.rows.length === 0" class="text-sm text-slate-500">
      Tidak ada data untuk laporan {{ labelFor(activeKey) }}.
    </p>

    <div v-else class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th v-for="col in dataset.columns" :key="col" class="whitespace-nowrap p-3">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in dataset.rows" :key="i" class="border-b border-slate-100">
            <td v-for="(cell, j) in row" :key="j" class="whitespace-nowrap p-3 text-slate-700">{{ cell ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
