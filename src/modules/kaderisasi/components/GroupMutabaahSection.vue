<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import FilterDateRange from '@/components/FilterDateRange.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { defaultYearToDate } from '@/utils/date'
import { kaderisasiApi } from '../api'
import type { GroupMutabaahSummary, MutabaahMemberRow } from '../types'

const props = defineProps<{ groupId: string }>()

const initial = defaultYearToDate()
const from = ref(initial.from)
const to = ref(initial.to)
const data = ref<GroupMutabaahSummary | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const invalidRange = computed(() => from.value !== '' && to.value !== '' && from.value > to.value)

async function load() {
  if (invalidRange.value || !from.value || !to.value) return
  loading.value = true
  error.value = null
  try {
    data.value = await kaderisasiApi.groupMutabaahSummary(props.groupId, from.value, to.value)
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

function itemPercentage(member: MutabaahMemberRow, code: string): number {
  return member.items.find((item) => item.code === code)?.percentage ?? 0
}

const itemColumnCount = computed(() => 1 + (data.value?.items.length ?? 0))
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-4">
    <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="font-semibold text-slate-900">Mutabaah Yaumiyah</h2>
        <p class="text-xs text-slate-500">
          Hari pada periode dibatasi sampai hari ini dan dihitung sejak anggota bergabung.
        </p>
      </div>
      <div class="sm:w-80">
        <FilterDateRange v-model:from="from" v-model:to="to" label="Periode mutabaah" @change="onRangeChange" />
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
      <h3 class="mb-2 text-sm font-semibold text-slate-700">Ketercapaian per Anggota</h3>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[40rem] border-collapse text-sm">
          <caption class="sr-only">
            Ketercapaian mutabaah per anggota
          </caption>
          <thead>
            <tr class="border-b border-slate-200 text-left text-slate-500">
              <th class="py-2 pr-4">Nama Anggota</th>
              <th class="py-2 pr-4 text-center">Hari Terisi</th>
              <th class="py-2 pr-4 text-center">Total Hari pada Periode</th>
              <th class="py-2 pr-4 text-center">Persentase Ketercapaian</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in data.members" :key="m.member_id" class="border-b border-slate-100">
              <td class="py-2 pr-4 text-slate-900">{{ m.person_code }} - {{ m.full_name }}</td>
              <td class="py-2 pr-4 text-center text-slate-700">{{ m.filled_days }}</td>
              <td class="py-2 pr-4 text-center text-slate-700">{{ m.total_days }}</td>
              <td class="py-2 pr-4 text-center font-medium text-slate-900">
                {{ m.total_days > 0 ? `${m.percentage.toFixed(1)}%` : '-' }}
              </td>
            </tr>
            <tr v-if="data.members.length === 0">
              <td colspan="4" class="py-3 text-slate-500">Belum ada data mutabaah pada periode ini</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="mb-2 mt-5 text-sm font-semibold text-slate-700">Persentase per Amalan</h3>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[40rem] border-collapse text-sm">
          <caption class="sr-only">
            Persentase amalan yaumiyah per anggota
          </caption>
          <thead>
            <tr class="border-b border-slate-200 text-left text-slate-500">
              <th class="sticky left-0 z-10 bg-white py-2 pr-4">Nama Anggota</th>
              <th v-for="item in data.items" :key="item.code" class="whitespace-nowrap px-2 py-2 text-center">
                {{ item.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="data.items.length > 0" class="border-b border-slate-200 bg-slate-50 font-medium">
              <td class="sticky left-0 z-10 bg-slate-50 py-2 pr-4 text-slate-900">Rata-rata kelompok</td>
              <td
                v-for="groupItem in data.items"
                :key="groupItem.code"
                class="px-2 py-2 text-center text-slate-900"
              >
                {{ groupItem.average_percentage.toFixed(1) }}%
              </td>
            </tr>
            <tr v-for="m in data.members" :key="m.member_id" class="border-b border-slate-100">
              <td class="sticky left-0 z-10 bg-white py-2 pr-4 text-slate-900">
                {{ m.person_code }} - {{ m.full_name }}
              </td>
              <td v-for="item in data.items" :key="`${m.member_id}-${item.code}`" class="px-2 py-2 text-center text-slate-700">
                {{ itemPercentage(m, item.code).toFixed(1) }}%
              </td>
            </tr>
            <tr v-if="data.items.length === 0">
              <td :colspan="itemColumnCount" class="py-3 text-slate-500">
                Belum ada data mutabaah pada periode ini
              </td>
            </tr>
            <tr v-else-if="data.members.length === 0">
              <td :colspan="itemColumnCount" class="py-3 text-slate-500">Belum ada anggota pada grup ini.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
