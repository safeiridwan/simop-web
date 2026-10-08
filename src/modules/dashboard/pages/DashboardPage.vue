<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useAuthStore } from '@/app/stores/auth'
import { dashboardApi } from '../api'
import type { DashboardSummary } from '../types'

const auth = useAuthStore()
const summary = ref<DashboardSummary | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const cards = computed(() => {
  const c = summary.value?.counts
  if (!c) return []
  return [
    { label: 'Orang', value: c.persons, to: '/people', permission: 'persons:read' },
    { label: 'Anggota Aktif', value: c.active_members, to: '/members', permission: 'members:read' },
    { label: 'Non-Anggota Aktif', value: c.active_affiliations, to: '/non-party', permission: 'members:read' },
    { label: 'Kader Aktif', value: c.active_cadres, to: '/cadres', permission: 'cadre:read' },
    { label: 'Unit Organisasi', value: c.organization_units, to: '/organization', permission: 'organization:read' },
    { label: 'Program', value: c.programs, to: '/programs', permission: 'programs:read' },
    { label: 'Program Berjalan', value: c.running_programs, to: '/programs', permission: 'programs:read' },
    { label: 'Kegiatan', value: c.activities, to: '/activities', permission: 'programs:read' },
    { label: 'Tugas Terbuka', value: c.open_tasks, to: '/tasks', permission: 'governance:read' },
    { label: 'Rapat Terencana', value: c.planned_meetings, to: '/meetings', permission: 'governance:read' },
    { label: 'Aset Tersedia', value: c.available_assets, to: '/assets', permission: 'assets:read' },
    { label: 'Dokumen', value: c.documents, to: '/documents', permission: 'documents:read' },
  ]
})

const visibleCards = computed(() => cards.value.filter((c) => auth.can(c.permission)))

onMounted(async () => {
  try {
    summary.value = await dashboardApi.summary()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat dasbor'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section>
    <header class="mb-6">
      <h1 class="text-xl font-semibold text-slate-900">Dashboard</h1>
      <p class="text-sm text-slate-600">Selamat datang, {{ auth.user?.full_name }}.</p>
    </header>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="summary">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
          <ul class="space-y-1 text-sm">
            <li v-for="l in summary.cadre_by_level" :key="l.level_code" class="flex justify-between">
              <span class="text-slate-600">{{ l.level_name }}</span>
              <span class="font-medium text-slate-900">{{ l.count }}</span>
            </li>
          </ul>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 text-sm font-semibold text-slate-900">Program per Status</h2>
          <ul class="space-y-1 text-sm">
            <li v-for="s in summary.programs_by_status" :key="s.status" class="flex justify-between">
              <span class="text-slate-600">{{ s.status }}</span>
              <span class="font-medium text-slate-900">{{ s.count }}</span>
            </li>
            <li v-if="summary.programs_by_status.length === 0" class="text-slate-500">Belum ada data.</li>
          </ul>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 text-sm font-semibold text-slate-900">Keuangan (Terposting)</h2>
          <dl class="space-y-1 text-sm">
            <div class="flex justify-between"><dt class="text-slate-600">Debit</dt><dd class="font-medium text-slate-900">{{ summary.finance_totals.total_debit.toLocaleString('id-ID') }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-600">Kredit</dt><dd class="font-medium text-slate-900">{{ summary.finance_totals.total_credit.toLocaleString('id-ID') }}</dd></div>
          </dl>
        </div>
      </div>
    </template>
  </section>
</template>
