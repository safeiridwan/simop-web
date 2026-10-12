<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import Pagination from '@/components/Pagination.vue'
import SortableTh from '@/components/SortableTh.vue'
import PersonPicker from '@/components/PersonPicker.vue'
import type { Person } from '@/modules/people/types'
import { affiliationsApi } from '../api'
import { useSort } from '@/composables/useSort'
import { AFFILIATION_TYPES, affiliationTypeLabel, type Affiliation, type ImportResult, type PageMeta } from '../types'

const affiliations = ref<Affiliation[]>([])
const meta = ref<PageMeta | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const search = ref('')
const selectedTypes = ref<string[]>(AFFILIATION_TYPES.map((t) => t.value))
const allSelected = computed(() => selectedTypes.value.length === AFFILIATION_TYPES.length)
const page = ref(1)
const pageSize = ref(10)
const { sort, direction, toggle } = useSort()

const showForm = ref(false)
const submitting = ref(false)
const selectedPerson = ref<Person | null>(null)
const form = reactive({ affiliation_type: AFFILIATION_TYPES[0].value, start_date: '', end_date: '', source: '', notes: '' })

const showImport = ref(false)
const importing = ref(false)
const importError = ref<string | null>(null)
const importResult = ref<ImportResult | null>(null)
const importFile = ref<File | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data, meta: pageMeta } = await affiliationsApi.list({
      search: search.value,
      types: selectedTypes.value,
      page: page.value,
      pageSize: pageSize.value,
      sort: sort.value,
      direction: direction.value,
    })
    affiliations.value = data
    meta.value = pageMeta ?? null
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat data'
    affiliations.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onSort(field: string) {
  toggle(field)
  page.value = 1
  void load()
}

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

function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  importFile.value = input.files?.[0] ?? null
}

async function onImport() {
  if (!importFile.value) {
    importError.value = 'Pilih berkas terlebih dahulu.'
    return
  }
  importing.value = true
  importError.value = null
  importResult.value = null
  try {
    importResult.value = await affiliationsApi.import(importFile.value)
    importFile.value = null
    await load()
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Gagal mengimpor'
  } finally {
    importing.value = false
  }
}

async function downloadImportTemplate(format: 'csv' | 'xlsx') {
  try {
    await affiliationsApi.importTemplate(format)
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Gagal mengunduh template'
  }
}

function toggleAll(event: Event) {
  selectedTypes.value = (event.target as HTMLInputElement).checked
    ? AFFILIATION_TYPES.map((t) => t.value)
    : []
}

async function submit() {
  if (!selectedPerson.value) {
    error.value = 'Pilih orang terlebih dahulu.'
    return
  }
  submitting.value = true
  error.value = null
  try {
    await affiliationsApi.create({
      person_id: selectedPerson.value.id,
      affiliation_type: form.affiliation_type,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      source: form.source || undefined,
      notes: form.notes || undefined,
    })
    showForm.value = false
    selectedPerson.value = null
    form.start_date = ''
    form.end_date = ''
    form.source = ''
    form.notes = ''
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Non-Kader</h1>
        <p class="text-sm text-slate-500">Hubungan non-anggota<span v-if="meta"> · {{ meta.total }} data</span></p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded border border-slate-300 px-3 py-2 text-sm"
          @click="showImport = !showImport"
        >
          {{ showImport ? 'Batal' : 'Impor' }}
        </button>
        <button
          type="button"
          class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit"
          @click="showForm = !showForm"
        >
          {{ showForm ? 'Batal' : 'Tambah' }}
        </button>
      </div>
    </header>

    <div v-if="showImport" class="mb-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <p class="text-sm text-slate-600">
        Unggah berkas CSV atau XLSX. Orang dicocokkan lewat NIK atau nomor HP (dibuat otomatis bila belum ada) dan jenis memakai kode
        (mis. SYMPATHIZER, VOLUNTEER). Baris gagal dilewati dan dilaporkan.
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-slate-500">Template:</span>
        <button type="button" class="text-sm text-brand-600 hover:underline" @click="downloadImportTemplate('csv')">CSV</button>
        <button type="button" class="text-sm text-brand-600 hover:underline" @click="downloadImportTemplate('xlsx')">XLSX</button>
      </div>
      <input type="file" accept=".csv,.xlsx" class="w-full text-sm" @change="onImportFile" />
      <p v-if="importError" class="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{{ importError }}</p>
      <button
        type="button"
        :disabled="importing"
        class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        @click="onImport"
      >
        {{ importing ? 'Mengimpor...' : 'Impor Sekarang' }}
      </button>
      <div v-if="importResult" class="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
        <p class="text-slate-700">Selesai: {{ importResult.created }} dibuat, {{ importResult.skipped }} dilewati.</p>
        <ul v-if="importResult.errors.length" class="mt-2 space-y-1 text-xs text-red-600">
          <li v-for="e in importResult.errors" :key="e.row">Baris {{ e.row }}: {{ e.message }}</li>
        </ul>
      </div>
    </div>

    <form v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="submit">
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700">Orang</label>
        <PersonPicker v-model="selectedPerson" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="a-type">Jenis</label>
        <select id="a-type" v-model="form.affiliation_type" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
          <option v-for="t in AFFILIATION_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="a-source">Sumber</label>
        <input id="a-source" v-model="form.source" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="a-start">Mulai</label>
        <input id="a-start" v-model="form.start_date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="a-end">Selesai</label>
        <input id="a-end" v-model="form.end_date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700" for="a-notes">Catatan</label>
        <input id="a-notes" v-model="form.notes" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <button
        type="submit"
        :disabled="submitting"
        class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit"
      >
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <div class="mb-3 flex flex-wrap items-center gap-2">
      <input
        v-model="search"
        placeholder="Cari nama atau kode"
        class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64"
        @keyup.enter="onFilter"
      />
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onFilter">Cari</button>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-3">
      <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" :checked="allSelected" @change="toggleAll" /> Semua
      </label>
      <label v-for="t in AFFILIATION_TYPES" :key="t.value" class="flex items-center gap-2 text-sm text-slate-600">
        <input v-model="selectedTypes" type="checkbox" :value="t.value" @change="onFilter" /> {{ t.label }}
      </label>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="affiliations.length === 0" class="text-sm text-slate-500">Belum ada data.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[60rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <SortableTh field="full_name" label="Nama" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="person_code" label="Kode" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="affiliation_type" label="Jenis" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="city_name" label="Kabupaten/Kota" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="district_name" label="Kecamatan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="village_name" label="Kelurahan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="start_date" label="Mulai" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="status" label="Status" :active="sort" :direction="direction" @sort="onSort" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in affiliations" :key="item.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 text-slate-900">{{ item.full_name }}</td>
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ item.person_code }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ affiliationTypeLabel(item.affiliation_type) }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ item.city_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ item.district_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ item.village_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ item.start_date || '—' }}</td>
            <td class="py-2 text-slate-600">{{ item.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
  </section>
</template>
