<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useAuthStore } from '@/app/stores/auth'
import { dataQualityApi } from '../api'
import { ISSUE_STATUSES, SEVERITIES, ruleLabel, severityLabel, type DataQualityIssue, type SummaryRow } from '../types'

const auth = useAuthStore()
const issues = ref<DataQualityIssue[]>([])
const summary = ref<SummaryRow[]>([])
const loading = ref(true)
const scanning = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)

const statusFilter = ref('OPEN')
const severityFilter = ref('')

const canResolve = computed(() => auth.can('data-quality:resolve'))

const openCount = computed(() => summary.value.filter((r) => r.status === 'OPEN').reduce((sum, r) => sum + r.count, 0))

const byRule = computed(() => {
  const map = new Map<string, { ruleCode: string; open: number; resolved: number; ignored: number }>()
  for (const row of summary.value) {
    const entry = map.get(row.rule_code) ?? { ruleCode: row.rule_code, open: 0, resolved: 0, ignored: 0 }
    if (row.status === 'OPEN') entry.open += row.count
    else if (row.status === 'RESOLVED') entry.resolved += row.count
    else if (row.status === 'IGNORED') entry.ignored += row.count
    map.set(row.rule_code, entry)
  }
  return [...map.values()]
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, sums] = await Promise.all([
      dataQualityApi.issues({ status: statusFilter.value, severity: severityFilter.value }),
      dataQualityApi.summary(),
    ])
    issues.value = list.data
    summary.value = sums
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat data quality'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function runScan() {
  scanning.value = true
  error.value = null
  notice.value = null
  try {
    const result = await dataQualityApi.scan()
    notice.value = `Pemindaian selesai: ${result.detected} masalah terdeteksi, ${result.resolved} ditutup otomatis.`
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Pemindaian gagal'
  } finally {
    scanning.value = false
  }
}

async function resolve(id: string, status: string) {
  saving.value = true
  error.value = null
  try {
    await dataQualityApi.resolve(id, status)
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Operasi gagal'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Kualitas Data</h1>
        <p class="text-sm text-slate-500">{{ openCount }} masalah terbuka</p>
      </div>
      <button
        v-if="canResolve"
        type="button"
        :disabled="scanning"
        class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:w-fit"
        @click="runScan"
      >
        {{ scanning ? 'Memindai...' : 'Jalankan Pemindaian' }}
      </button>
    </header>

    <p v-if="notice" class="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">{{ notice }}</p>
    <p v-if="error" class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div v-if="!loading && byRule.length" class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <div v-for="r in byRule" :key="r.ruleCode" class="rounded-lg border border-slate-200 bg-white p-3">
        <p class="text-lg font-semibold" :class="r.open ? 'text-brand-600' : 'text-slate-400'">{{ r.open }}</p>
        <p class="text-xs text-slate-600">{{ ruleLabel(r.ruleCode) }}</p>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="load">
        <option v-for="s in ISSUE_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <select v-model="severityFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="load">
        <option value="">Semua tingkat</option>
        <option v-for="s in SEVERITIES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="load">Muat ulang</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="issues.length === 0" class="text-sm text-slate-500">Tidak ada masalah pada filter ini.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Aturan</th>
            <th class="py-2 pr-4">Tingkat</th>
            <th class="py-2 pr-4">Sumber Daya</th>
            <th class="py-2 pr-4">Status</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="issue in issues" :key="issue.id" class="border-b border-slate-100">
            <td class="py-2 pr-4 text-slate-900">
              {{ ruleLabel(issue.rule_code) }}
              <span v-if="issue.details" class="block text-xs text-slate-500">{{ issue.details }}</span>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ severityLabel(issue.severity) }}</td>
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ issue.resource_type }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ issue.status }}</td>
            <td class="py-2">
              <button
                v-if="issue.status === 'OPEN' && canResolve"
                type="button"
                :disabled="saving"
                class="mr-2 text-xs text-brand-600 hover:underline disabled:opacity-50"
                @click="resolve(issue.id, 'RESOLVED')"
              >
                Selesaikan
              </button>
              <button
                v-if="issue.status === 'OPEN' && canResolve"
                type="button"
                :disabled="saving"
                class="text-xs text-slate-500 hover:underline disabled:opacity-50"
                @click="resolve(issue.id, 'IGNORED')"
              >
                Abaikan
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
