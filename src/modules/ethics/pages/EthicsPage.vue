<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import Pagination from '@/components/Pagination.vue'
import { ethicsApi } from '../api'
import { ETHICS_STATUSES, ethicsStatusLabel, type EthicsCase, type PageMeta } from '../types'

const cases = ref<EthicsCase[]>([])
const meta = ref<PageMeta | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const form = reactive({ title: '', description: '', confidentiality: 'RESTRICTED' })

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data, meta: pageMeta } = await ethicsApi.list({ search: search.value, status: statusFilter.value, page: page.value })
    cases.value = data
    meta.value = pageMeta ?? null
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat kasus'
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

async function submit() {
  submitting.value = true
  error.value = null
  try {
    await ethicsApi.create({ title: form.title, description: form.description || undefined, confidentiality: form.confidentiality })
    showForm.value = false
    form.title = ''
    form.description = ''
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan kasus'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Etik</h1>
        <p class="text-sm text-slate-500">Kasus etik — data terbatas<span v-if="meta"> · {{ meta.total }} kasus</span></p>
      </div>
      <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
        {{ showForm ? 'Batal' : 'Buka Kasus' }}
      </button>
    </header>

    <p class="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
      Data etik bersifat rahasia. Akses hanya untuk petugas berwenang dan tidak ditampilkan pada dasbor umum.
    </p>

    <div v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
      <input v-model="form.title" placeholder="Judul kasus" required class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
      <textarea v-model="form.description" rows="2" placeholder="Deskripsi" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
      <select v-model="form.confidentiality" class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="RESTRICTED">Terbatas</option>
        <option value="HIGHLY_RESTRICTED">Sangat terbatas</option>
      </select>
      <button type="button" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="submit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <input v-model="search" placeholder="Cari judul atau nomor" class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64" @keyup.enter="onFilter" />
      <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="onFilter">
        <option value="">Semua status</option>
        <option v-for="s in ETHICS_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onFilter">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="cases.length === 0" class="text-sm text-slate-500">Belum ada kasus.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Nomor</th>
            <th class="py-2 pr-4">Judul</th>
            <th class="py-2 pr-4">Status</th>
            <th class="py-2">Kerahasiaan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in cases" :key="c.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ c.case_number }}</td>
            <td class="py-2 pr-4">
              <router-link :to="`/ethics/cases/${c.id}`" class="text-brand-600 hover:underline">{{ c.title }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ ethicsStatusLabel(c.status) }}</td>
            <td class="py-2 text-slate-600">{{ c.confidentiality === 'HIGHLY_RESTRICTED' ? 'Sangat terbatas' : 'Terbatas' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" />
  </section>
</template>
