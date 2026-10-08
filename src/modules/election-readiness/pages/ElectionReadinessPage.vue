<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useAuthStore } from '@/app/stores/auth'
import { downloadFile } from '@/services/http'
import { electionReadinessApi } from '../api'
import { ISSUE_STATUSES, checkLabel, type ReadinessCheck, type ReadinessSummary } from '../types'

const auth = useAuthStore()
const summary = ref<ReadinessSummary | null>(null)
const checks = ref<ReadinessCheck[]>([])
const loading = ref(true)
const scanning = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)
const statusFilter = ref('OPEN')

const canResolve = computed(() => auth.can('election-readiness:resolve'))

const readinessPct = computed(() => {
  if (!summary.value) return 0
  const total = summary.value.total_open + summary.value.total_resolved
  if (total === 0) return 100
  return Math.round((summary.value.total_resolved / total) * 100)
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const [sum, list] = await Promise.all([
      electionReadinessApi.summary(),
      electionReadinessApi.checks({ status: statusFilter.value }),
    ])
    summary.value = sum
    checks.value = list.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat kesiapan'
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
    const result = await electionReadinessApi.scan()
    notice.value = `Pemindaian selesai: ${result.detected} temuan, ${result.resolved} ditutup otomatis.`
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
    await electionReadinessApi.resolve(id, status)
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Operasi gagal'
  } finally {
    saving.value = false
  }
}

async function onExport() {
  try {
    await downloadFile(electionReadinessApi.exportUrl, 'election-readiness.csv')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal mengekspor'
  }
}
</script>

<template>
  <section>
    <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Kesiapan Data</h1>
        <p class="text-sm text-slate-500">Verifikasi internal untuk kebutuhan administrasi &amp; pelaporan</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onExport">Ekspor CSV</button>
        <button
          v-if="canResolve"
          type="button"
          :disabled="scanning"
          class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          @click="runScan"
        >
          {{ scanning ? 'Memindai...' : 'Jalankan Pemindaian' }}
        </button>
      </div>
    </header>

    <p class="mb-4 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
      Modul ini membantu kesiapan data internal, bukan menggantikan sistem resmi regulator.
    </p>

    <p v-if="notice" class="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">{{ notice }}</p>
    <p v-if="error" class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>

    <template v-else-if="summary">
      <div class="mb-6 grid grid-cols-3 gap-3">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <p class="text-2xl font-semibold text-brand-600">{{ summary.total_open }}</p>
          <p class="text-sm text-slate-600">Terbuka</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <p class="text-2xl font-semibold text-green-700">{{ summary.total_resolved }}</p>
          <p class="text-sm text-slate-600">Selesai</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <p class="text-2xl font-semibold text-slate-900">{{ readinessPct }}%</p>
          <p class="text-sm text-slate-600">Kesiapan</p>
        </div>
      </div>

      <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="item in summary.items" :key="item.code" class="rounded-lg border border-slate-200 bg-white p-3">
          <p class="text-sm font-medium text-slate-900">{{ checkLabel(item.code) }}</p>
          <p class="mt-1 text-xs text-slate-500">Terbuka {{ item.open }} · Selesai {{ item.resolved }}</p>
        </div>
      </div>
    </template>

    <div class="mb-4 flex flex-wrap gap-2">
      <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="load">
        <option v-for="s in ISSUE_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="load">Muat ulang</button>
    </div>

    <p v-if="!loading && checks.length === 0" class="text-sm text-slate-500">Tidak ada temuan pada filter ini.</p>

    <div v-else-if="checks.length" class="overflow-x-auto">
      <table class="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Pemeriksaan</th>
            <th class="py-2 pr-4">Tingkat</th>
            <th class="py-2 pr-4">Sumber Daya</th>
            <th class="py-2 pr-4">Status</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="check in checks" :key="check.id" class="border-b border-slate-100">
            <td class="py-2 pr-4 text-slate-900">
              {{ checkLabel(check.rule_code) }}
              <span v-if="check.details" class="block text-xs text-slate-500">{{ check.details }}</span>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ check.severity }}</td>
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ check.resource_type }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ check.status }}</td>
            <td class="py-2">
              <button
                v-if="check.status === 'OPEN' && canResolve"
                type="button"
                :disabled="saving"
                class="mr-2 text-xs text-brand-600 hover:underline disabled:opacity-50"
                @click="resolve(check.id, 'RESOLVED')"
              >
                Selesaikan
              </button>
              <button
                v-if="check.status === 'OPEN' && canResolve"
                type="button"
                :disabled="saving"
                class="text-xs text-slate-500 hover:underline disabled:opacity-50"
                @click="resolve(check.id, 'IGNORED')"
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
