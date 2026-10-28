<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import FilterDateRange from '@/components/FilterDateRange.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { defaultYearToDate, formatDate } from '@/utils/date'
import { kaderisasiApi } from '../api'
import {
  attendanceCellState,
  groupAttendanceByMonth,
  type AttendanceMemberRow,
  type AttendanceSessionRow,
  type GroupAttendanceSummary,
} from '../types'

const props = defineProps<{ groupId: string }>()

const initial = defaultYearToDate()
const from = ref(initial.from)
const to = ref(initial.to)
const data = ref<GroupAttendanceSummary | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const openMonths = ref<Set<string>>(new Set())

const invalidRange = computed(() => from.value !== '' && to.value !== '' && from.value > to.value)

async function load() {
  if (invalidRange.value || !from.value || !to.value) return
  loading.value = true
  error.value = null
  try {
    data.value = await kaderisasiApi.groupAttendanceSummary(props.groupId, from.value, to.value)
    openMonths.value = new Set(months.value.length > 0 ? [months.value[0].key] : [])
  } catch (err) {
    data.value = null
    openMonths.value = new Set()
    error.value = 'Data gagal dimuat'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onRangeChange() {
  void load()
}

const empty = computed(() => data.value !== null && data.value.sessions.length === 0)
const members = computed(() => data.value?.members ?? [])
const months = computed(() => groupAttendanceByMonth(data.value?.sessions ?? [], members.value))

function panelId(monthKey: string): string {
  return `attendance-month-${props.groupId}-${monthKey}`
}

function isOpen(monthKey: string): boolean {
  return openMonths.value.has(monthKey)
}

function toggleMonth(monthKey: string) {
  const next = new Set(openMonths.value)
  if (next.has(monthKey)) next.delete(monthKey)
  else next.add(monthKey)
  openMonths.value = next
}

function cellState(member: AttendanceMemberRow, session: AttendanceSessionRow) {
  return attendanceCellState(member, session)
}
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-4">
    <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="font-semibold text-slate-900">Kehadiran Temu Pekanan</h2>
        <p class="text-xs text-slate-500">
          Pertemuan sejak anggota bergabung dihitung; pertemuan sebelumnya ikut dihitung bila anggota
          tercatat hadir.
        </p>
      </div>
      <div class="sm:w-80">
        <FilterDateRange v-model:from="from" v-model:to="to" label="Periode kehadiran" @change="onRangeChange" />
      </div>
    </div>

    <SkeletonBlock v-if="loading" kind="table" :rows="4" />

    <div v-else-if="error" class="py-3">
      <p class="text-sm text-slate-600">Data gagal dimuat.</p>
      <button type="button" class="mt-2 rounded border border-slate-300 px-3 py-1 text-sm" @click="load">
        Coba lagi
      </button>
    </div>

    <template v-else-if="data">
      <div class="mb-3 flex flex-wrap gap-4 text-sm text-slate-700">
        <p>
          Rata-rata kehadiran kelompok:
          <span class="font-semibold text-slate-900">{{ data.summary.average_percentage.toFixed(1) }}%</span>
        </p>
        <p>
          Jumlah pertemuan:
          <span class="font-semibold text-slate-900">{{ data.summary.meeting_count }}</span>
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[40rem] border-collapse text-sm">
          <caption class="sr-only">
            Ringkasan kehadiran anggota
          </caption>
          <thead>
            <tr class="border-b border-slate-200 text-left text-slate-500">
              <th class="sticky left-0 z-10 bg-white py-2 pr-4">Nama Anggota</th>
              <th class="py-2 pr-4 text-center">Hadir</th>
              <th class="py-2 pr-4 text-center">Total Pertemuan</th>
              <th class="py-2 pr-4 text-center">Persentase Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="empty">
              <td colspan="4" class="py-3 text-slate-500">
                Belum ada data kehadiran pada periode ini
              </td>
            </tr>
            <template v-else>
              <tr v-for="m in data.members" :key="m.member_id" class="border-b border-slate-100">
                <td class="sticky left-0 z-10 bg-white py-2 pr-4 text-slate-900">
                  {{ m.person_code }} - {{ m.full_name }}
                </td>
                <td class="py-2 pr-4 text-center text-slate-700">{{ m.attended }}</td>
                <td class="py-2 pr-4 text-center text-slate-700">{{ m.total_meetings }}</td>
                <td class="py-2 pr-4 text-center font-medium text-slate-900">
                  {{ m.total_meetings > 0 ? `${m.percentage.toFixed(1)}%` : '-' }}
                </td>
              </tr>
              <tr v-if="data.members.length === 0">
                <td colspan="4" class="py-3 text-slate-500">Belum ada anggota pada grup ini.</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="mt-6">
        <h3 class="font-semibold text-slate-900">Ceklis Kehadiran per Bulan</h3>
        <p v-if="empty || months.length === 0" class="mt-2 text-sm text-slate-500">
          Belum ada data kehadiran pada periode ini
        </p>
        <p v-else-if="data.members.length === 0" class="mt-2 text-sm text-slate-500">
          Belum ada anggota pada grup ini.
        </p>
        <div v-else class="mt-3 space-y-3">
          <section v-for="month in months" :key="month.key" class="rounded-lg border border-slate-200">
            <h4>
              <button
                type="button"
                class="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left"
                :aria-expanded="isOpen(month.key)"
                :aria-controls="panelId(month.key)"
                @click="toggleMonth(month.key)"
              >
                <span class="flex items-center gap-2 font-medium text-slate-900">
                  <span aria-hidden="true" class="text-slate-400">{{ isOpen(month.key) ? '▾' : '▸' }}</span>
                  {{ month.label }}
                </span>
                <span class="text-xs text-slate-500">
                  {{ month.meeting_count }} pertemuan · rata-rata
                  {{ month.average_percentage.toFixed(1) }}%
                </span>
              </button>
            </h4>
            <div v-show="isOpen(month.key)" :id="panelId(month.key)" class="overflow-x-auto border-t border-slate-200">
              <table class="w-full min-w-[32rem] border-collapse text-sm">
                <caption class="sr-only">
                  Kehadiran anggota {{ month.label }}
                </caption>
                <thead class="sticky top-0 z-10 bg-white">
                  <tr class="border-b border-slate-200 text-left text-slate-500">
                    <th class="sticky left-0 z-20 bg-white py-2 pr-4">Nama Anggota</th>
                    <th
                      v-for="s in month.sessions"
                      :key="s.id"
                      class="whitespace-nowrap px-2 py-2 text-center font-medium"
                      :title="formatDate(s.session_date)"
                    >
                      {{ formatDate(s.session_date) }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in data.members" :key="m.member_id" class="border-b border-slate-100">
                    <td class="sticky left-0 z-10 whitespace-nowrap bg-white py-2 pr-4 text-slate-900">
                      {{ m.person_code }} - {{ m.full_name }}
                    </td>
                    <td v-for="s in month.sessions" :key="`${m.member_id}-${s.id}`" class="px-2 py-2 text-center">
                      <span
                        v-if="cellState(m, s) === 'present'"
                        aria-label="Hadir"
                        title="Hadir"
                        class="text-green-700"
                      >
                        ✓
                      </span>
                      <span
                        v-else-if="cellState(m, s) === 'not_applicable'"
                        aria-label="Belum bergabung"
                        title="Belum bergabung"
                        class="text-slate-400"
                      >
                        –
                      </span>
                      <span v-else aria-label="Tidak hadir" title="Tidak hadir" class="text-slate-500">×</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </template>
  </section>
</template>
