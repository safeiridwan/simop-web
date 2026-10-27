<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useAuthStore } from '@/app/stores/auth'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { dashboardApi } from '../api'
import type { DashboardCounts, LevelCount, StatusCount, FinanceTotals } from '../types'

const auth = useAuthStore()

const counts = ref<DashboardCounts | null>(null)
const countsLoading = ref(true)
const countsError = ref<string | null>(null)

const levels = ref<LevelCount[]>([])
const levelsLoading = ref(true)
const levelsError = ref<string | null>(null)

const programs = ref<StatusCount[]>([])
const programsLoading = ref(true)
const programsError = ref<string | null>(null)

const finance = ref<FinanceTotals | null>(null)
const financeLoading = ref(true)
const financeError = ref<string | null>(null)

function message(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

const cards = computed(() => {
  const c = counts.value
  if (!c) return []
  return [
    { label: 'Orang', value: c.persons, to: '/people', permission: 'persons:read' },
    { label: 'Anggota Aktif', value: c.active_members, to: '/members', permission: 'members:read' },
    { label: 'Non-Anggota Aktif', value: c.active_affiliations, to: '/non-party', permission: 'members:read' },
    { label: 'Kader Aktif', value: c.active_cadres, to: '/cadres', permission: 'cadre:read' },
    { label: 'Unit Organisasi', value: c.organization_units, to: '/organization', permission: 'organization:read' },
    { label: 'Program', value: c.programs, to: '/programs', permission: 'programs:read' },
    { label: 'Program Berjalan', value: c.running_programs, to: '/programs', permission: 'programs:read' },
    { label: 'Kegiatan', value: c.activities, to: '/programs', permission: 'programs:read' },
    { label: 'Tugas Terbuka', value: c.open_tasks, to: '/tasks', permission: 'governance:read' },
    { label: 'Rapat Terencana', value: c.planned_meetings, to: '/meetings', permission: 'governance:read' },
    { label: 'Aset Tersedia', value: c.available_assets, to: '/assets', permission: 'assets:read' },
    { label: 'Dokumen', value: c.documents, to: '/documents', permission: 'documents:read' },
  ]
})

const visibleCards = computed(() => cards.value.filter((c) => auth.can(c.permission)))

async function loadCounts() {
  countsLoading.value = true
  countsError.value = null
  try {
    counts.value = (await dashboardApi.section('counts')).counts ?? null
  } catch (err) {
    countsError.value = message(err, 'Data gagal dimuat')
  } finally {
    countsLoading.value = false
  }
}

async function loadLevels() {
  levelsLoading.value = true
  levelsError.value = null
  try {
    levels.value = (await dashboardApi.section('cadre_by_level')).cadre_by_level ?? []
  } catch (err) {
    levelsError.value = message(err, 'Data gagal dimuat')
  } finally {
    levelsLoading.value = false
  }
}

async function loadPrograms() {
  programsLoading.value = true
  programsError.value = null
  try {
    programs.value = (await dashboardApi.section('programs_by_status')).programs_by_status ?? []
  } catch (err) {
    programsError.value = message(err, 'Data gagal dimuat')
  } finally {
    programsLoading.value = false
  }
}

async function loadFinance() {
  financeLoading.value = true
  financeError.value = null
  try {
    finance.value = (await dashboardApi.section('finance_totals')).finance_totals ?? null
  } catch (err) {
    financeError.value = message(err, 'Data gagal dimuat')
  } finally {
    financeLoading.value = false
  }
}

onMounted(() => {
  void loadCounts()
  void loadLevels()
  void loadPrograms()
  void loadFinance()
})
</script>

<template>
  <section>
    <header class="mb-6">
      <h1 class="text-xl font-semibold text-slate-900">Dashboard</h1>
      <p class="text-sm text-slate-600">Selamat datang, {{ auth.user?.full_name }}.</p>
    </header>

    <div v-if="countsLoading" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <SkeletonBlock v-for="n in 4" :key="n" kind="card" />
    </div>
    <div v-else-if="countsError" class="rounded-lg border border-slate-200 bg-white p-4">
      <p class="text-sm text-slate-500">Data gagal dimuat</p>
      <button type="button" class="mt-2 rounded border border-slate-300 px-3 py-1 text-sm" @click="loadCounts">
        Coba lagi
      </button>
    </div>
    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <template v-for="c in visibleCards" :key="c.label">
        <router-link
          v-if="c.to"
          :to="c.to"
          class="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
        >
          <p class="text-2xl font-semibold text-brand-600">{{ c.value }}</p>
          <p class="text-sm text-slate-600">{{ c.label }}</p>
        </router-link>
        <div v-else class="rounded-lg border border-slate-200 bg-white p-4">
          <p class="text-2xl font-semibold text-brand-600">{{ c.value }}</p>
          <p class="text-sm text-slate-600">{{ c.label }}</p>
        </div>
      </template>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 text-sm font-semibold text-slate-900">Kader per Jenjang</h2>
        <SkeletonBlock v-if="levelsLoading" kind="table" :rows="3" />
        <div v-else-if="levelsError">
          <p class="text-sm text-slate-500">Data gagal dimuat</p>
          <button type="button" class="mt-2 rounded border border-slate-300 px-3 py-1 text-sm" @click="loadLevels">
            Coba lagi
          </button>
        </div>
        <ul v-else class="space-y-1 text-sm">
          <li v-for="l in levels" :key="l.level_code || l.level_name" class="flex justify-between">
            <span class="text-slate-600">{{ l.level_name }}</span>
            <span class="font-medium text-slate-900">{{ l.count }}</span>
          </li>
          <li v-if="levels.length === 0" class="text-slate-500">Tidak ada data.</li>
        </ul>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 text-sm font-semibold text-slate-900">Program per Status</h2>
        <SkeletonBlock v-if="programsLoading" kind="table" :rows="3" />
        <div v-else-if="programsError">
          <p class="text-sm text-slate-500">Data gagal dimuat</p>
          <button type="button" class="mt-2 rounded border border-slate-300 px-3 py-1 text-sm" @click="loadPrograms">
            Coba lagi
          </button>
        </div>
        <ul v-else class="space-y-1 text-sm">
          <li v-for="s in programs" :key="s.status" class="flex justify-between">
            <span class="text-slate-600">{{ s.status }}</span>
            <span class="font-medium text-slate-900">{{ s.count }}</span>
          </li>
          <li v-if="programs.length === 0" class="text-slate-500">Tidak ada data.</li>
        </ul>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 text-sm font-semibold text-slate-900">Keuangan (Terposting)</h2>
        <SkeletonBlock v-if="financeLoading" kind="table" :rows="2" />
        <div v-else-if="financeError">
          <p class="text-sm text-slate-500">Data gagal dimuat</p>
          <button type="button" class="mt-2 rounded border border-slate-300 px-3 py-1 text-sm" @click="loadFinance">
            Coba lagi
          </button>
        </div>
        <dl v-else class="space-y-1 text-sm">
          <div class="flex justify-between">
            <dt class="text-slate-600">Debit</dt>
            <dd class="font-medium text-slate-900">{{ (finance?.total_debit ?? 0).toLocaleString('id-ID') }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-600">Kredit</dt>
            <dd class="font-medium text-slate-900">{{ (finance?.total_credit ?? 0).toLocaleString('id-ID') }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>
