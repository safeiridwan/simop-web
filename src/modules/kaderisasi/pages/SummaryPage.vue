<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import Pagination from '@/components/Pagination.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import PieChart from '@/components/charts/PieChart.vue'
import { formatDate } from '@/utils/date'
import { kaderisasiApi } from '../api'
import {
  weeklyAgendaStatusLabel,
  type LevelCount,
  type PageMeta,
  type SummaryPayload,
  type SummaryPeriod,
  type SummarySection,
  type TopAttendanceRow,
  type TopMutabaahRow,
  type WeeklyAgendaRow,
} from '../types'

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const month = ref(currentMonth())
const period = ref<SummaryPeriod | null>(null)
const agendaPage = ref(1)
const agendaPageSize = ref(10)

const groups = ref<LevelCount[]>([])
const groupsLoading = ref(true)
const groupsError = ref<string | null>(null)

const members = ref<LevelCount[]>([])
const membersLoading = ref(true)
const membersError = ref<string | null>(null)

const totalCadres = ref(0)
const totalLoading = ref(true)
const totalError = ref<string | null>(null)

const agenda = ref<WeeklyAgendaRow[]>([])
const agendaMeta = ref<PageMeta | null>(null)
const agendaLoading = ref(true)
const agendaError = ref<string | null>(null)

const mutabaah = ref<TopMutabaahRow[]>([])
const mutabaahLoading = ref(true)
const mutabaahError = ref<string | null>(null)

const attendance = ref<TopAttendanceRow[]>([])
const attendanceLoading = ref(true)
const attendanceError = ref<string | null>(null)

function message(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

async function fetchSection(section: SummarySection, page = 1): Promise<SummaryPayload> {
  const payload = await kaderisasiApi.summary({
    section,
    month: month.value,
    page,
    pageSize: agendaPageSize.value,
  })
  period.value = payload.period
  return payload
}

async function loadGroups() {
  groupsLoading.value = true
  groupsError.value = null
  try {
    groups.value = (await fetchSection('groups_by_level')).groups_by_level ?? []
  } catch (err) {
    groupsError.value = message(err, 'Gagal memuat data kelompok per jenjang')
  } finally {
    groupsLoading.value = false
  }
}

async function loadMembers() {
  membersLoading.value = true
  membersError.value = null
  try {
    members.value = (await fetchSection('members_by_level')).members_by_level ?? []
  } catch (err) {
    membersError.value = message(err, 'Gagal memuat data anggota per jenjang')
  } finally {
    membersLoading.value = false
  }
}

async function loadTotal() {
  totalLoading.value = true
  totalError.value = null
  try {
    totalCadres.value = (await fetchSection('total')).total_cadres ?? 0
  } catch (err) {
    totalError.value = message(err, 'Gagal memuat total kader')
  } finally {
    totalLoading.value = false
  }
}

async function loadAgenda() {
  agendaLoading.value = true
  agendaError.value = null
  try {
    const result = (await fetchSection('weekly_agenda', agendaPage.value)).weekly_agenda
    agenda.value = result?.items ?? []
    agendaMeta.value = result?.meta ?? null
  } catch (err) {
    agendaError.value = message(err, 'Gagal memuat agenda pekanan')
    agenda.value = []
  } finally {
    agendaLoading.value = false
  }
}

async function loadMutabaah() {
  mutabaahLoading.value = true
  mutabaahError.value = null
  try {
    mutabaah.value = (await fetchSection('top_mutabaah')).top_mutabaah ?? []
  } catch (err) {
    mutabaahError.value = message(err, 'Gagal memuat ketercapaian mutabaah')
  } finally {
    mutabaahLoading.value = false
  }
}

async function loadAttendance() {
  attendanceLoading.value = true
  attendanceError.value = null
  try {
    attendance.value = (await fetchSection('top_attendance')).top_attendance ?? []
  } catch (err) {
    attendanceError.value = message(err, 'Gagal memuat ketercapaian kehadiran')
  } finally {
    attendanceLoading.value = false
  }
}

function loadAll() {
  void loadGroups()
  void loadMembers()
  void loadTotal()
  void loadAgenda()
  void loadMutabaah()
  void loadAttendance()
}

onMounted(loadAll)
watch(month, () => {
  agendaPage.value = 1
  loadAll()
})

function onAgendaPage(target: number) {
  agendaPage.value = target
  void loadAgenda()
}

function onAgendaPageSize(size: number) {
  agendaPageSize.value = size
  agendaPage.value = 1
  void loadAgenda()
}

const groupsTotal = computed(() => groups.value.reduce((sum, row) => sum + row.count, 0))
const membersTotal = computed(() => members.value.reduce((sum, row) => sum + row.count, 0))
const groupLabels = computed(() =>
  groups.value.map((row) => `${row.name} (${row.count} · ${row.percentage.toFixed(1)}%)`),
)
const groupValues = computed(() => groups.value.map((row) => row.count))
const memberLabels = computed(() =>
  members.value.map((row) => `${row.name} (${row.count} · ${row.percentage.toFixed(1)}%)`),
)
const memberValues = computed(() => members.value.map((row) => row.count))
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Ringkasan Kaderisasi</h1>
        <p class="text-sm text-slate-500">
          {{ period ? `Data ${formatDate(period.from)} s/d ${formatDate(period.to)} · minggu ${formatDate(period.week_start)} s/d ${formatDate(period.week_end)}` : 'Memuat periode...' }}
        </p>
      </div>
      <label class="flex items-center gap-2 text-sm text-slate-600">
        Bulan
        <input v-model="month" type="month" class="rounded border border-slate-300 px-2 py-1 text-sm" />
      </label>
    </header>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Jumlah Kelompok per Jenjang</h2>
        <SkeletonBlock v-if="groupsLoading" kind="chart" />
        <div v-else-if="groupsError">
          <PieChart :labels="[]" :values="[]" disabled empty-label="Data gagal dimuat" aria-label="Kelompok per jenjang" />
          <p class="mt-2 text-sm text-slate-500">Data kelompok gagal dimuat.</p>
          <button type="button" class="mt-2 rounded border border-slate-300 px-3 py-1 text-sm" @click="loadGroups">Coba lagi</button>
        </div>
        <template v-else>
          <PieChart :labels="groupLabels" :values="groupValues" :disabled="groupsTotal === 0" empty-label="Belum ada data" aria-label="Kelompok per jenjang" />
          <ul class="mt-3 space-y-1 text-xs text-slate-600">
            <li v-for="row in groups" :key="row.level_id ?? row.name" class="flex justify-between gap-3">
              <span>{{ row.name }}</span>
              <span>{{ row.count }} · {{ row.percentage.toFixed(1) }}%</span>
            </li>
          </ul>
          <table class="sr-only">
            <caption>Jumlah kelompok per jenjang</caption>
            <thead><tr><th>Jenjang</th><th>Jumlah</th><th>Persentase</th></tr></thead>
            <tbody>
              <tr v-for="row in groups" :key="`t-${row.level_id ?? row.name}`">
                <td>{{ row.name }}</td><td>{{ row.count }}</td><td>{{ row.percentage.toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-1 font-semibold text-slate-900">Jumlah Anggota per Jenjang</h2>
        <p class="mb-3 text-xs text-slate-500">Seluruh kader aktif per jenjang, termasuk yang belum tergabung di grup pembinaan.</p>
        <SkeletonBlock v-if="membersLoading" kind="chart" />
        <div v-else-if="membersError">
          <PieChart :labels="[]" :values="[]" disabled empty-label="Data gagal dimuat" aria-label="Anggota per jenjang" />
          <p class="mt-2 text-sm text-slate-500">Data anggota gagal dimuat.</p>
          <button type="button" class="mt-2 rounded border border-slate-300 px-3 py-1 text-sm" @click="loadMembers">Coba lagi</button>
        </div>
        <template v-else>
          <PieChart :labels="memberLabels" :values="memberValues" :disabled="membersTotal === 0" empty-label="Belum ada data" aria-label="Anggota per jenjang" />
          <ul class="mt-3 space-y-1 text-xs text-slate-600">
            <li v-for="row in members" :key="row.level_id ?? row.name" class="flex justify-between gap-3">
              <span>{{ row.name }}</span>
              <span>{{ row.count }} · {{ row.percentage.toFixed(1) }}%</span>
            </li>
          </ul>
          <table class="sr-only">
            <caption>Jumlah anggota per jenjang</caption>
            <thead><tr><th>Jenjang</th><th>Jumlah</th><th>Persentase</th></tr></thead>
            <tbody>
              <tr v-for="row in members" :key="`t-${row.level_id ?? row.name}`">
                <td>{{ row.name }}</td><td>{{ row.count }}</td><td>{{ row.percentage.toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>
    </div>

    <div class="mt-6 rounded-lg border border-slate-200 bg-white p-4">
      <h2 class="mb-1 font-semibold text-slate-900">Total Kader Semua Jenjang</h2>
      <SkeletonBlock v-if="totalLoading" kind="card" />
      <div v-else-if="totalError">
        <p class="text-3xl font-semibold text-slate-400">—</p>
        <p class="mt-2 text-sm text-slate-500">Total kader gagal dimuat.</p>
        <button type="button" class="mt-2 rounded border border-slate-300 px-3 py-1 text-sm" @click="loadTotal">Coba lagi</button>
      </div>
      <template v-else>
        <p class="text-3xl font-semibold text-slate-900">{{ totalCadres }}</p>
        <p class="text-xs text-slate-500">Seluruh kader aktif, termasuk yang belum tergabung di grup pembinaan.</p>
      </template>
    </div>

    <div class="mt-6 rounded-lg border border-slate-200 bg-white p-4">
      <h2 class="mb-3 font-semibold text-slate-900">Agenda Pekanan</h2>
      <SkeletonBlock v-if="agendaLoading" kind="table" :rows="5" />
      <div v-else-if="agendaError">
        <p class="py-3 text-sm text-slate-500">Agenda pekanan gagal dimuat.</p>
        <button type="button" class="rounded border border-slate-300 px-3 py-1 text-sm" @click="loadAgenda">Coba lagi</button>
      </div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[46rem] border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-slate-500">
                <th class="py-2 pr-4">Nama Kelompok</th>
                <th class="py-2 pr-4">Murabbi</th>
                <th class="py-2 pr-4">Jenjang</th>
                <th class="py-2 pr-4">Tanggal Pertemuan Terakhir</th>
                <th class="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in agenda" :key="row.group_id" class="border-b border-slate-100">
                <td class="py-2 pr-4 text-slate-900">{{ row.name }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ row.murabbi || '-' }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ row.level_name || 'Belum ditentukan' }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ row.last_session_date ? formatDate(row.last_session_date) : '-' }}</td>
                <td class="py-2 text-slate-600">{{ weeklyAgendaStatusLabel(row.status) }}</td>
              </tr>
              <tr v-if="agenda.length === 0">
                <td colspan="5" class="py-3 text-slate-500">Belum ada data.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination :meta="agendaMeta" @change="onAgendaPage" @page-size-change="onAgendaPageSize" />
      </template>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Ketercapaian Mutabaah Yaumiyah (Top 10)</h2>
        <SkeletonBlock v-if="mutabaahLoading" kind="table" :rows="5" />
        <div v-else-if="mutabaahError">
          <p class="py-3 text-sm text-slate-500">Data mutabaah gagal dimuat.</p>
          <button type="button" class="rounded border border-slate-300 px-3 py-1 text-sm" @click="loadMutabaah">Coba lagi</button>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-slate-500">
                <th class="py-2 pr-4">Peringkat</th>
                <th class="py-2 pr-4">Nama Kader</th>
                <th class="py-2 pr-4">Jenjang</th>
                <th class="py-2 pr-4">Kelompok</th>
                <th class="py-2">Ketercapaian</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in mutabaah" :key="`${row.rank}-${row.full_name}`" class="border-b border-slate-100">
                <td class="py-2 pr-4 text-slate-600">{{ row.rank }}</td>
                <td class="py-2 pr-4 text-slate-900">{{ row.full_name }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ row.level_name }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ row.group_name || '-' }}</td>
                <td class="py-2 text-slate-600">{{ row.percentage.toFixed(1) }}% ({{ row.filled_days }}/{{ row.total_days }} hari)</td>
              </tr>
              <tr v-if="mutabaah.length === 0">
                <td colspan="5" class="py-3 text-slate-500">Belum ada data.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Ketercapaian Kehadiran Temu Pekanan (Top 10)</h2>
        <SkeletonBlock v-if="attendanceLoading" kind="table" :rows="5" />
        <div v-else-if="attendanceError">
          <p class="py-3 text-sm text-slate-500">Data kehadiran gagal dimuat.</p>
          <button type="button" class="rounded border border-slate-300 px-3 py-1 text-sm" @click="loadAttendance">Coba lagi</button>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-slate-500">
                <th class="py-2 pr-4">Peringkat</th>
                <th class="py-2 pr-4">Nama Kader</th>
                <th class="py-2 pr-4">Jenjang</th>
                <th class="py-2 pr-4">Kelompok</th>
                <th class="py-2">Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in attendance" :key="`${row.rank}-${row.full_name}`" class="border-b border-slate-100">
                <td class="py-2 pr-4 text-slate-600">{{ row.rank }}</td>
                <td class="py-2 pr-4 text-slate-900">{{ row.full_name }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ row.level_name }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ row.group_name || '-' }}</td>
                <td class="py-2 text-slate-600">{{ row.percentage.toFixed(1) }}% ({{ row.approved }}/{{ row.total_meetings }} pertemuan)</td>
              </tr>
              <tr v-if="attendance.length === 0">
                <td colspan="5" class="py-3 text-slate-500">Belum ada data.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
