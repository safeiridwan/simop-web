<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import Pagination from '@/components/Pagination.vue'
import { useAuthStore } from '@/app/stores/auth'
import { correspondenceApi } from '../api'
import {
  LETTER_STATUSES,
  agendaColorClass,
  categoryLabel,
  letterStatusLabel,
  type Letter,
  type PageMeta,
  type Reference,
} from '../types'
import { formatDate } from '@/utils/date'

const auth = useAuthStore()
const canExport = auth.can('correspondence:export')

const letters = ref<Letter[]>([])
const meta = ref<PageMeta | null>(null)
const jenisList = ref<Reference[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const exporting = ref(false)
const page = ref(1)
const pageSize = ref(10)

const filters = reactive({
  from: '',
  to: '',
  category: '',
  status: '',
  jenis_id: '',
  keyword: '',
  sender: '',
  disposition_status: '',
})

function query() {
  return {
    from: filters.from || undefined,
    to: filters.to || undefined,
    category: filters.category || undefined,
    status: filters.status || undefined,
    jenisId: filters.jenis_id || undefined,
    keyword: filters.keyword || undefined,
    sender: filters.sender || undefined,
    dispositionStatus: filters.disposition_status || undefined,
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await correspondenceApi.agenda(query(), page.value, pageSize.value)
    letters.value = res.data
    meta.value = res.meta ?? null
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat agenda'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    jenisList.value = await correspondenceApi.references('JENIS')
  } catch {
    jenisList.value = []
  }
  await load()
})

function apply() {
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

async function exportAgenda(format: 'xlsx' | 'pdf') {
  exporting.value = true
  error.value = null
  try {
    await correspondenceApi.exportAgenda(query(), format)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal mengekspor'
  } finally {
    exporting.value = false
  }
}

function numberLabel(letter: Letter): string {
  return letter.letter_number || letter.origin_number || '—'
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Buku Agenda</h1>
        <p class="text-sm text-slate-500">Rekapitulasi surat masuk &amp; keluar</p>
      </div>
      <div v-if="canExport" class="flex gap-2">
        <button type="button" :disabled="exporting" class="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50" @click="exportAgenda('xlsx')">
          Ekspor Excel
        </button>
        <button type="button" :disabled="exporting" class="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50" @click="exportAgenda('pdf')">
          Ekspor PDF
        </button>
      </div>
    </header>

    <form class="mb-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-4" @submit.prevent="apply">
      <label class="flex flex-col text-sm text-slate-600">Dari<input v-model="filters.from" type="date" class="mt-1 rounded border border-slate-300 px-3 py-2 text-sm" /></label>
      <label class="flex flex-col text-sm text-slate-600">Sampai<input v-model="filters.to" type="date" class="mt-1 rounded border border-slate-300 px-3 py-2 text-sm" /></label>
      <select v-model="filters.category" class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="">Semua kategori</option>
        <option value="MASUK">Masuk</option>
        <option value="KELUAR">Keluar</option>
      </select>
      <select v-model="filters.jenis_id" class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="">Semua jenis</option>
        <option v-for="j in jenisList" :key="j.id" :value="j.id">{{ j.code }}</option>
      </select>
      <input v-model="filters.keyword" placeholder="Kata kunci perihal/nomor" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="filters.sender" placeholder="Nama pengirim" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <select v-model="filters.disposition_status" class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="">Semua status disposisi</option>
        <option value="PENDING">Proses</option>
        <option value="DONE">Selesai</option>
      </select>
      <select v-model="filters.status" class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="">Semua status surat</option>
        <option v-for="s in LETTER_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="submit" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit">Terapkan</button>
    </form>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="letters.length === 0" class="text-sm text-slate-500">Tidak ada data untuk filter ini.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[52rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Tanggal</th>
            <th class="py-2 pr-4">Kategori</th>
            <th class="py-2 pr-4">Nomor Surat</th>
            <th class="py-2 pr-4">Judul/Perihal</th>
            <th class="py-2 pr-4">Pengirim/Tujuan</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in letters" :key="l.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 text-slate-600">{{ formatDate(l.letter_date) }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ categoryLabel(l.category) }}</td>
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">
              <router-link :to="`/administration/letters/${l.id}`" class="text-brand-600 hover:underline">{{ numberLabel(l) }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-900">{{ l.perihal }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ (l.category === 'MASUK' ? l.sender : l.recipient) || '—' }}</td>
            <td class="py-2">
              <span class="rounded px-2 py-0.5 text-xs font-medium" :class="agendaColorClass(l.status)">
                {{ letterStatusLabel(l.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
  </section>
</template>
