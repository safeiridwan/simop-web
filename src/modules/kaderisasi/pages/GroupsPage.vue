<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import FilterDateRange from '@/components/FilterDateRange.vue'
import FilterTextInput from '@/components/FilterTextInput.vue'
import ImportPanel from '@/components/ImportPanel.vue'
import Pagination from '@/components/Pagination.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useSort } from '@/composables/useSort'
import { formatDate } from '@/utils/date'
import { kaderisasiApi, type ImportResult } from '../api'
import { GROUP_STATUSES, groupStatusLabel, type CoachingGroup, type Level, type PageMeta } from '../types'

const items = ref<CoachingGroup[]>([])
const levels = ref<Level[]>([])
const meta = ref<PageMeta | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const nameFilter = ref('')
const levelFilter = ref('')
const murabbiFilter = ref('')
const statusFilter = ref('')
const formedFrom = ref('')
const formedTo = ref('')
const page = ref(1)
const pageSize = ref(10)
const { sort, direction, toggle } = useSort()

const showImport = ref(false)
const importing = ref(false)
const importResult = ref<ImportResult | null>(null)
const importError = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, levelList] = await Promise.all([
      kaderisasiApi.listGroups({
        name: nameFilter.value || undefined,
        levelId: levelFilter.value || undefined,
        murabbi: murabbiFilter.value || undefined,
        status: statusFilter.value || undefined,
        formedFrom: formedFrom.value || undefined,
        formedTo: formedTo.value || undefined,
        sort: sort.value,
        direction: direction.value,
        page: page.value,
        pageSize: pageSize.value,
      }),
      kaderisasiApi.levels(),
    ])
    items.value = list.data
    meta.value = list.meta ?? null
    levels.value = levelList
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat grup pembinaan'
  } finally {
    loading.value = false
  }
}

onMounted(load)

watch(nameFilter, () => {
  page.value = 1
  void load()
})

watch(murabbiFilter, () => {
  page.value = 1
  void load()
})

function onFilterChange() {
  page.value = 1
  void load()
}

function onSort(field: string) {
  toggle(field)
  page.value = 1
  void load()
}

function onPageChange(target: number) {
  page.value = target
  void load()
}

function onPageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  void load()
}

async function onImport(file: File) {
  importing.value = true
  importResult.value = null
  importError.value = null
  try {
    importResult.value = await kaderisasiApi.importGroups(file)
    if (importResult.value.created > 0) await load()
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Gagal mengimpor'
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Grup Pembinaan</h1>
        <p class="text-sm text-slate-500">{{ meta?.total ?? items.length }} grup</p>
      </div>
      <div class="flex gap-2">
        <button type="button" class="rounded border border-brand-500 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50" @click="showImport = !showImport">
          {{ showImport ? 'Tutup Impor' : 'Impor' }}
        </button>
        <router-link :to="{ name: 'kaderisasi-group-new' }" class="rounded bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600 sm:w-fit">
          Tambah Grup
        </router-link>
      </div>
    </header>

    <ImportPanel
      v-if="showImport"
      template-path="/api/v1/kaderisasi/coaching-groups/import/template"
      template-filename="template-grup-pembinaan"
      :busy="importing"
      :result="importResult"
      :error="importError"
      @import="onImport"
    />

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="items.length === 0" class="text-sm text-slate-500">Belum ada grup pembinaan.</p>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[54rem] border-collapse text-sm">
        <thead class="sticky top-0 z-10 bg-white">
          <tr class="border-b border-slate-200 text-slate-500">
            <SortableTh field="name" label="Nama" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="level" label="Jenjang" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="formed_at" label="Tanggal Terbentuk" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="member_count" label="Jumlah Peserta" :active="sort" :direction="direction" align="right" @sort="onSort" />
            <SortableTh field="murabbi" label="Murabbi" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="status" label="Status" :active="sort" :direction="direction" @sort="onSort" />
          </tr>
          <tr class="border-b border-slate-200">
            <th class="pb-2 pr-4"><FilterTextInput v-model="nameFilter" label="Filter nama" placeholder="Cari nama" /></th>
            <th class="pb-2 pr-4">
              <select v-model="levelFilter" class="w-full rounded border border-slate-300 px-2 py-1 text-xs font-normal" aria-label="Filter jenjang" @change="onFilterChange">
                <option value="">Semua jenjang</option>
                <option v-for="l in levels" :key="l.id" :value="l.id">{{ l.name }}</option>
              </select>
            </th>
            <th class="pb-2 pr-4">
              <FilterDateRange v-model:from="formedFrom" v-model:to="formedTo" label="Filter tanggal terbentuk" @change="onFilterChange" />
            </th>
            <th class="pb-2 pr-4"></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="murabbiFilter" label="Filter murabbi" placeholder="Cari murabbi" /></th>
            <th class="pb-2">
              <select v-model="statusFilter" class="w-full rounded border border-slate-300 px-2 py-1 text-xs font-normal" aria-label="Filter status" @change="onFilterChange">
                <option value="">Semua status</option>
                <option v-for="s in GROUP_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in items" :key="g.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4">
              <router-link :to="`/kaderisasi/grup-pembinaan/${g.id}`" class="text-brand-600 hover:underline">{{ g.name }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ g.level_name || '-' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ g.formed_at ? formatDate(g.formed_at) : '-' }}</td>
            <td class="py-2 pr-4 text-right text-slate-600">{{ g.member_count }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ g.murabbi }}</td>
            <td class="py-2 text-slate-600">{{ groupStatusLabel(g.status) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
  </section>
</template>
