<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import FilterDateRange from '@/components/FilterDateRange.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { defaultYearToDate, formatDate } from '@/utils/date'
import { kaderisasiApi } from '../api'
import type { GroupAttendanceSummary } from '../types'

const props = defineProps<{ groupId: string }>()

const initial = defaultYearToDate()
const from = ref(initial.from)
const to = ref(initial.to)
const data = ref<GroupAttendanceSummary | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const invalidRange = computed(() => from.value !== '' && to.value !== '' && from.value > to.value)

async function load() {
  if (invalidRange.value || !from.value || !to.value) return
  loading.value = true
  error.value = null
  try {
    data.value = await kaderisasiApi.groupAttendanceSummary(props.groupId, from.value, to.value)
  } catch (err) {
    data.value = null
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
const columnCount = computed(() => 4 + (data.value?.sessions.length ?? 0))

function attended(sessionIds: string[], sessionId: string): boolean {
  return sessionIds.includes(sessionId)
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
        <table class="w-full min-w-[48rem] border-collapse text-sm">
          <caption class="sr-only">
            Kehadiran anggota per pertemuan
          </caption>
          <thead>
            <tr class="border-b border-slate-200 text-left text-slate-500">
              <th class="sticky left-0 z-10 bg-white py-2 pr-4">Nama Anggota</th>
              <th class="py-2 pr-4 text-center">Hadir</th>
              <th class="py-2 pr-4 text-center">Total Pertemuan</th>
              <th class="py-2 pr-4 text-center">Persentase Kehadiran</th>
              <th
                v-for="s in data.sessions"
                :key="s.id"
                class="whitespace-nowrap px-2 py-2 text-center font-medium"
              >
                {{ formatDate(s.session_date) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="empty">
              <td :colspan="columnCount" class="py-3 text-slate-500">
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
                <td
                  v-for="s in data.sessions"
                  :key="`${m.member_id}-${s.id}`"
                  class="px-2 py-2 text-center"
                >
                  <span
                    v-if="attended(m.attended_session_ids, s.id)"
                    aria-label="Hadir"
                    title="Hadir"
                    class="text-green-700"
                  >
                    ✓
                  </span>
                  <span
                    v-else-if="s.session_date < m.joined_at"
                    aria-label="Belum bergabung"
                    title="Belum bergabung"
                    class="text-slate-400"
                  >
                    –
                  </span>
                  <span v-else aria-label="Tidak hadir" title="Tidak hadir" class="text-slate-500">×</span>
                </td>
              </tr>
              <tr v-if="data.members.length === 0">
                <td :colspan="columnCount" class="py-3 text-slate-500">Belum ada anggota pada grup ini.</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
