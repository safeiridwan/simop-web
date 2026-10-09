<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { reportsApi } from '@/modules/reports/api'
import type { Dataset } from '@/modules/reports/types'
import { DATED_REPORT_KEYS, FINANCE_REPORT_KEYS } from '../types'

const activeKey = ref(FINANCE_REPORT_KEYS[0].key)
const dataset = ref<Dataset | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const exporting = ref(false)

const from = ref('')
const to = ref('')
const isDated = computed(() => DATED_REPORT_KEYS.has(activeKey.value))

function currentQuery() {
  return { from: from.value, to: to.value }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    dataset.value = await reportsApi.get(activeKey.value, isDated.value ? currentQuery() : {})
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat laporan'
    dataset.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)

function select(key: string) {
  if (activeKey.value === key) return
  activeKey.value = key
  void load()
}

async function onExport() {
  exporting.value = true
  error.value = null
  try {
    await reportsApi.export(activeKey.value, isDated.value ? currentQuery() : {})
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal mengekspor'
  } finally {
    exporting.value = false
  }
}

function labelFor(key: string): string {
  return FINANCE_REPORT_KEYS.find((r) => r.key === key)?.label ?? key
}
</script>

<template>
  <section>
    <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-xl font-semibold text-slate-900">Laporan Keuangan</h1>
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
        v-for="r in FINANCE_REPORT_KEYS"
        :key="r.key"
        type="button"
        class="rounded border px-3 py-1.5 text-sm"
        :class="activeKey === r.key ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 text-slate-700'"
        @click="select(r.key)"
      >
        {{ r.label }}
      </button>
    </nav>

    <div v-if="isDated" class="mb-4 flex flex-wrap items-end gap-2">
      <label class="flex flex-col text-sm text-slate-600">
        Dari
        <input v-model="from" type="date" class="mt-1 rounded border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <label class="flex flex-col text-sm text-slate-600">
        Sampai
        <input v-model="to" type="date" class="mt-1 rounded border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="load">Terapkan</button>
    </div>

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
