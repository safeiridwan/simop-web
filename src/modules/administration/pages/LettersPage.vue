<script setup lang="ts">
import { onMounted, ref } from 'vue'

import Pagination from '@/components/Pagination.vue'
import { correspondenceApi } from '../api'
import { LETTER_STATUSES, categoryLabel, letterStatusLabel, type Letter, type PageMeta } from '../types'

const letters = ref<Letter[]>([])
const meta = ref<PageMeta | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const search = ref('')
const category = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = ref(10)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await correspondenceApi.letters({
      search: search.value || undefined,
      category: category.value || undefined,
      status: statusFilter.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    })
    letters.value = res.data
    meta.value = res.meta ?? null
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat surat'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onSearch() {
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

function numberLabel(letter: Letter): string {
  return letter.letter_number || letter.origin_number || '—'
}

function jenisLabel(letter: Letter): string {
  if (!letter.jenis_code) return '—'
  return letter.jenis_name ? `${letter.jenis_code} - ${letter.jenis_name}` : letter.jenis_code
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Manajemen Surat</h1>
        <p class="text-sm text-slate-500">{{ meta?.total ?? letters.length }} surat</p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <router-link
          :to="{ name: 'administration-letter-new', query: { category: 'MASUK' } }"
          class="rounded bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600"
        >
          Tambah Surat Masuk
        </router-link>
        <router-link
          :to="{ name: 'administration-letter-new', query: { category: 'KELUAR' } }"
          class="rounded border border-brand-500 px-3 py-2 text-center text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          Tambah Surat Keluar
        </router-link>
      </div>
    </header>

    <div class="mb-4 flex flex-col gap-2 sm:flex-row">
      <input
        v-model="search"
        placeholder="Cari judul / nomor / pengirim"
        class="rounded border border-slate-300 px-3 py-2 text-sm sm:w-72"
        @keyup.enter="onSearch"
      />
      <select v-model="category" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="onSearch">
        <option value="">Semua kategori</option>
        <option value="MASUK">Masuk</option>
        <option value="KELUAR">Keluar</option>
      </select>
      <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="onSearch">
        <option value="">Semua status</option>
        <option v-for="s in LETTER_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onSearch">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="letters.length === 0" class="text-sm text-slate-500">Belum ada surat.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[52rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Judul</th>
            <th class="py-2 pr-4">Kategori</th>
            <th class="py-2 pr-4">Jenis</th>
            <th class="py-2 pr-4">Nomor Surat</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in letters" :key="l.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4">
              <router-link :to="`/administration/letters/${l.id}`" class="text-brand-600 hover:underline">
                {{ l.perihal }}
              </router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ categoryLabel(l.category) }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ jenisLabel(l) }}</td>
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ numberLabel(l) }}</td>
            <td class="py-2 text-slate-600">{{ letterStatusLabel(l.status) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
  </section>
</template>
