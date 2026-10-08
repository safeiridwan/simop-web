<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useAuthStore } from '@/app/stores/auth'
import ActivityPanel from '../components/ActivityPanel.vue'
import { activitiesApi, programsApi } from '../api'
import { PROGRAM_TRANSITIONS, programStatusLabel, type Activity, type ProgramDetail } from '../types'

const route = useRoute()
const auth = useAuthStore()
const id = route.params.id as string

const detail = ref<ProgramDetail | null>(null)
const activities = ref<Activity[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const targetForm = reactive({ target_name: '', target_value: '', unit: '' })
const indicatorForm = reactive({ indicator_name: '', target_value: '', actual_value: '', unit: '' })
const reportForm = reactive({ title: '', summary: '' })
const openActivity = ref<string | null>(null)

function transitions() {
  if (!detail.value) return []
  return PROGRAM_TRANSITIONS[detail.value.program.status] ?? []
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [d, acts] = await Promise.all([programsApi.get(id), activitiesApi.list({ programId: id })])
    detail.value = d
    activities.value = acts.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat program'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function run(fn: () => Promise<unknown>) {
  saving.value = true
  error.value = null
  try {
    await fn()
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Operasi gagal'
  } finally {
    saving.value = false
  }
}

function transition(action: string) {
  void run(() => programsApi.transition(id, action))
}

function addTarget() {
  void run(async () => {
    await programsApi.addTarget(id, {
      target_name: targetForm.target_name,
      target_value: targetForm.target_value ? Number(targetForm.target_value) : undefined,
      unit: targetForm.unit || undefined,
    })
    targetForm.target_name = ''
    targetForm.target_value = ''
    targetForm.unit = ''
  })
}

function addIndicator() {
  void run(async () => {
    await programsApi.addIndicator(id, {
      indicator_name: indicatorForm.indicator_name,
      target_value: indicatorForm.target_value ? Number(indicatorForm.target_value) : undefined,
      actual_value: indicatorForm.actual_value ? Number(indicatorForm.actual_value) : undefined,
      unit: indicatorForm.unit || undefined,
    })
    indicatorForm.indicator_name = ''
    indicatorForm.target_value = ''
    indicatorForm.actual_value = ''
    indicatorForm.unit = ''
  })
}

function addReport() {
  void run(async () => {
    await programsApi.addReport(id, { title: reportForm.title, summary: reportForm.summary || undefined })
    reportForm.title = ''
    reportForm.summary = ''
  })
}

function removeTarget(targetId: string) {
  void run(() => programsApi.deleteTarget(id, targetId))
}

function removeIndicator(indicatorId: string) {
  void run(() => programsApi.deleteIndicator(id, indicatorId))
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="detail">
      <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <router-link to="/programs" class="text-sm text-brand-600 hover:underline">← Program</router-link>
          <h1 class="text-xl font-semibold text-slate-900">{{ detail.program.name }}</h1>
          <p class="font-mono text-xs text-slate-500">{{ detail.program.program_code }} · {{ detail.program.organization_unit_name }}</p>
          <p class="mt-1 text-sm text-slate-600">Status: <strong>{{ programStatusLabel(detail.program.status) }}</strong></p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in transitions()"
            :key="t.action"
            type="button"
            :disabled="saving || !auth.can(t.permission)"
            class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            @click="transition(t.action)"
          >
            {{ t.label }}
          </button>
          <button
            v-if="detail.program.status !== 'COMPLETED' && detail.program.status !== 'CANCELLED'"
            type="button"
            :disabled="saving"
            class="rounded border border-red-300 px-3 py-2 text-sm text-red-600 disabled:opacity-50"
            @click="transition('cancel')"
          >
            Batalkan
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Target</h2>
          <ul class="mb-3 space-y-1 text-sm">
            <li v-for="t in detail.targets" :key="t.id" class="flex items-center justify-between gap-2">
              <span class="text-slate-900">{{ t.target_name }} <span class="text-xs text-slate-500">{{ t.target_value ?? '' }} {{ t.unit ?? '' }}</span></span>
              <button type="button" class="text-xs text-red-600 hover:underline" :disabled="saving" @click="removeTarget(t.id)">Hapus</button>
            </li>
            <li v-if="detail.targets.length === 0" class="text-slate-500">Belum ada target.</li>
          </ul>
          <form class="grid gap-2 sm:grid-cols-3" @submit.prevent="addTarget">
            <input v-model="targetForm.target_name" placeholder="Target" required class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
            <input v-model="targetForm.unit" placeholder="Satuan" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="targetForm.target_value" type="number" step="any" placeholder="Nilai" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2">Tambah Target</button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Indikator</h2>
          <ul class="mb-3 space-y-1 text-sm">
            <li v-for="i in detail.indicators" :key="i.id" class="flex items-center justify-between gap-2">
              <span class="text-slate-900">{{ i.indicator_name }} <span class="text-xs text-slate-500">{{ i.actual_value ?? 0 }}/{{ i.target_value ?? 0 }} {{ i.unit ?? '' }}</span></span>
              <button type="button" class="text-xs text-red-600 hover:underline" :disabled="saving" @click="removeIndicator(i.id)">Hapus</button>
            </li>
            <li v-if="detail.indicators.length === 0" class="text-slate-500">Belum ada indikator.</li>
          </ul>
          <form class="grid gap-2 sm:grid-cols-3" @submit.prevent="addIndicator">
            <input v-model="indicatorForm.indicator_name" placeholder="Indikator" required class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-3" />
            <input v-model="indicatorForm.target_value" type="number" step="any" placeholder="Target" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="indicatorForm.actual_value" type="number" step="any" placeholder="Aktual" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="indicatorForm.unit" placeholder="Satuan" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-3 sm:w-fit">Tambah Indikator</button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Laporan</h2>
          <ul class="mb-3 space-y-1 text-sm">
            <li v-for="r in detail.reports" :key="r.id" class="text-slate-900">{{ r.title }}<span class="block text-xs text-slate-500">{{ r.summary }}</span></li>
            <li v-if="detail.reports.length === 0" class="text-slate-500">Belum ada laporan.</li>
          </ul>
          <form class="grid gap-2" @submit.prevent="addReport">
            <input v-model="reportForm.title" placeholder="Judul laporan" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="reportForm.summary" placeholder="Ringkasan" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm sm:w-fit">Tambah Laporan</button>
          </form>
        </div>

        <ActivityPanel
          :program-id="id"
          :unit-id="detail.program.organization_unit_id"
          :activities="activities"
          :open-activity="openActivity"
          @changed="load"
          @toggle="(aid) => (openActivity = openActivity === aid ? null : aid)"
        />
      </div>
    </template>
  </section>
</template>
