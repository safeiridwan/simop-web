<script setup lang="ts">
import { onMounted, ref } from 'vue'

import Pagination from '@/components/Pagination.vue'
import { formatDate } from '@/utils/date'
import { kaderisasiApi } from '../api'
import { TAKLIMAT_STATUSES, taklimatStatusLabel, type PageMeta, type Taklimat } from '../types'

const items = ref<Taklimat[]>([])
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
    const res = await kaderisasiApi.listTaklimat({
      search: search.value || undefined,
      status: statusFilter.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    })
    items.value = res.data
    meta.value = res.meta ?? null
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat taklimat'
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

function targetsLabel(t: Taklimat): string {
  return t.targets.length > 0 ? t.targets.map((l) => l.name).join(', ') : '—'
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Taklimat</h1>
        <p class="text-sm text-slate-500">{{ meta?.total ?? items.length }} taklimat</p>
      </div>
      <router-link
        :to="{ name: 'kaderisasi-taklimat-new' }"
        class="rounded bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600 sm:w-fit"
      >
        Tambah Taklimat
      </router-link>
    </header>

    <div class="mb-4 flex flex-wrap gap-2">
      <input v-model="search" placeholder="Cari judul" class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64" @keyup.enter="onFilter" />
      <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="onFilter">
        <option value="">Semua status</option>
        <option v-for="s in TAKLIMAT_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onFilter">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="items.length === 0" class="text-sm text-slate-500">Belum ada taklimat.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Judul</th>
            <th class="py-2 pr-4">Tanggal Terbit</th>
            <th class="py-2 pr-4">Sasaran</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in items" :key="t.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4">
              <router-link :to="`/kaderisasi/taklimat/${t.id}`" class="text-brand-600 hover:underline">{{ t.title }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ formatDate(t.publish_date) }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ targetsLabel(t) }}</td>
            <td class="py-2 text-slate-600">{{ taklimatStatusLabel(t.status) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
  </section>
</template>
