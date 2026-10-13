<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { financeApi } from '../api'
import type { PaguSummary } from '../types'

const rows = ref<PaguSummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const fiscalYear = ref(new Date().getFullYear())
const exporting = ref(false)

function money(v: number): string {
  return v.toLocaleString('id-ID')
}

async function load() {
  loading.value = true
  error.value = null
  try {
    rows.value = await financeApi.listPagu(fiscalYear.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat ringkasan pagu'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function exportCsv() {
  exporting.value = true
  try {
    const header = ['Unit', 'Pagu', 'Komitmen', 'Realisasi', 'Sisa']
    const lines = rows.value.map((r) => [r.organization_unit_name, r.pagu, r.committed, r.realized, r.remaining])
    const csv = [header, ...lines].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `pagu-${fiscalYear.value}.csv`
    link.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Pagu Bidang</h1>
        <p class="text-sm text-slate-500">Ringkasan pagu, komitmen program, realisasi, dan sisa per bidang.</p>
      </div>
      <button
        type="button"
        :disabled="exporting || rows.length === 0"
        class="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50 sm:w-fit"
        @click="exportCsv"
      >
        {{ exporting ? 'Mengekspor...' : 'Ekspor CSV' }}
      </button>
    </header>

    <div class="mb-4 flex flex-wrap items-end gap-2">
      <label class="flex flex-col text-sm text-slate-600">
        Tahun
        <input v-model.number="fiscalYear" type="number" class="mt-1 rounded border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="load">Terapkan</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="rows.length === 0" class="text-sm text-slate-500">Belum ada pagu untuk tahun {{ fiscalYear }}.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Unit</th>
            <th class="py-2 pr-4 text-right">Pagu</th>
            <th class="py-2 pr-4 text-right">Komitmen</th>
            <th class="py-2 pr-4 text-right">Realisasi</th>
            <th class="py-2 text-right">Sisa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.organization_unit_id" class="border-b border-slate-100">
            <td class="py-2 pr-4 text-slate-900">{{ r.organization_unit_name }}</td>
            <td class="py-2 pr-4 text-right text-slate-600">{{ money(r.pagu) }}</td>
            <td class="py-2 pr-4 text-right text-slate-600">{{ money(r.committed) }}</td>
            <td class="py-2 pr-4 text-right text-slate-600">{{ money(r.realized) }}</td>
            <td class="py-2 text-right font-medium" :class="r.remaining < 0 ? 'text-red-600' : 'text-slate-900'">{{ money(r.remaining) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
