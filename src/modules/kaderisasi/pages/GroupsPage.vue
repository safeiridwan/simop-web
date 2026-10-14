<script setup lang="ts">
import { onMounted, ref } from 'vue'

import Pagination from '@/components/Pagination.vue'
import { kaderisasiApi } from '../api'
import { GROUP_STATUSES, groupStatusLabel, type CoachingGroup, type PageMeta } from '../types'

const items = ref<CoachingGroup[]>([])
const meta = ref<PageMeta | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = ref(10)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await kaderisasiApi.listGroups({
      search: search.value || undefined,
      status: statusFilter.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    })
    items.value = res.data
    meta.value = res.meta ?? null
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat grup pembinaan'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onFilter() {
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
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Grup Pembinaan</h1>
        <p class="text-sm text-slate-500">{{ meta?.total ?? items.length }} grup</p>
      </div>
      <router-link :to="{ name: 'kaderisasi-group-new' }" class="rounded bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600 sm:w-fit">
        Tambah Grup
      </router-link>
    </header>

    <div class="mb-4 flex flex-wrap gap-2">
      <input v-model="search" placeholder="Cari nama atau murabbi" class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64" @keyup.enter="onFilter" />
      <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="onFilter">
        <option value="">Semua status</option>
        <option v-for="s in GROUP_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onFilter">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="items.length === 0" class="text-sm text-slate-500">Belum ada grup pembinaan.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2 pr-4">Jenjang</th>
            <th class="py-2 pr-4 text-right">Jumlah Peserta</th>
            <th class="py-2 pr-4">Murabbi</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in items" :key="g.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4">
              <router-link :to="`/kaderisasi/grup-pembinaan/${g.id}`" class="text-brand-600 hover:underline">{{ g.name }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ g.level_name || '—' }}</td>
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
