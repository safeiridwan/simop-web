<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import BarChart from '@/components/charts/BarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import { formatRupiah } from '@/utils/currency'
import { programsApi } from '../api'
import type { ProgramSummary, TypeTotal } from '../types'

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const year = ref(new Date().getFullYear())
const summary = ref<ProgramSummary | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const pieLabels = computed(() =>
  (summary.value?.type_composition ?? []).map(
    (t) => `${t.label} (${t.count} · ${t.percentage.toFixed(1)}%)`,
  ),
)
const pieValues = computed(() => (summary.value?.type_composition ?? []).map((t) => t.count))
const barValues = computed(() => (summary.value?.monthly ?? []).map((m) => m.count))
const totalsByType = computed<TypeTotal[]>(() => summary.value?.totals_by_type ?? [])

const isEmpty = computed(() => {
  const s = summary.value
  if (!s) return false
  const hasComposition = s.type_composition.some((t) => t.count > 0)
  const hasMonthly = s.monthly.some((m) => m.count > 0)
  return !hasComposition && !hasMonthly && s.grand_total === 0
})

async function load() {
  loading.value = true
  error.value = null
  try {
    summary.value = await programsApi.summary(year.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat ringkasan program'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Ringkasan Program</h1>
        <p class="text-sm text-slate-500">Komposisi tipe, kegiatan per bulan, dan realisasi anggaran.</p>
      </div>
      <label class="flex items-center gap-2 text-sm text-slate-600">
        Tahun
        <input v-model.number="year" type="number" class="w-24 rounded border border-slate-300 px-2 py-1 text-sm" @change="load" />
      </label>
    </header>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="isEmpty" class="rounded border border-slate-200 bg-white p-4 text-sm text-slate-500">
      Belum ada data program untuk ditampilkan.
    </p>

    <template v-else-if="summary">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Komposisi Tipe Program</h2>
          <PieChart v-if="pieValues.some((v) => v > 0)" :labels="pieLabels" :values="pieValues" />
          <p v-else class="text-sm text-slate-500">Belum ada program.</p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Jumlah Kegiatan per Bulan ({{ summary.year }})</h2>
          <BarChart :labels="MONTHS" :values="barValues" />
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Grand Total Anggaran (Selesai)</h2>
          <p class="text-2xl font-semibold text-slate-900">{{ formatRupiah(summary.grand_total) }}</p>
          <dl class="mt-3 space-y-1 text-sm">
            <div v-for="t in totalsByType" :key="t.type" class="flex justify-between gap-4">
              <dt class="text-slate-500">{{ t.label }} (selesai)</dt>
              <dd class="text-slate-900">{{ formatRupiah(t.total) }}</dd>
            </div>
            <p v-if="totalsByType.length === 0" class="text-slate-500">Belum ada program selesai.</p>
          </dl>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Total Realisasi per Unit (Selesai)</h2>
          <ul v-if="summary.totals_by_unit.length" class="space-y-1 text-sm">
            <li v-for="u in summary.totals_by_unit" :key="u.organization_unit_id" class="flex justify-between gap-4">
              <span class="text-slate-600">{{ u.organization_unit_name }}</span>
              <span class="text-slate-900">{{ formatRupiah(u.total) }}</span>
            </li>
          </ul>
          <p v-else class="text-sm text-slate-500">Belum ada unit dengan program.</p>
        </div>
      </div>
    </template>
  </section>
</template>
