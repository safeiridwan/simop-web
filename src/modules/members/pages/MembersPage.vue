<script setup lang="ts">
import { onMounted, ref } from 'vue'

import Pagination from '@/components/Pagination.vue'
import SortableTh from '@/components/SortableTh.vue'
import PersonPicker from '@/components/PersonPicker.vue'
import type { Person } from '@/modules/people/types'
import { downloadFile } from '@/services/http'
import { membersApi } from '../api'
import { useMembers } from '../composables/useMembers'
import { useSort } from '@/composables/useSort'
import { MEMBER_STATUSES, memberStatusLabel, type CreateMemberInput, type ImportResult } from '../types'

const { members, meta, loading, error, load } = useMembers()

const search = ref('')
const status = ref('')
const page = ref(1)
const pageSize = ref(10)
const { sort, direction, toggle } = useSort()
const showForm = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)

const selectedPerson = ref<Person | null>(null)
const joinDate = ref('')
const source = ref('')

const showImport = ref(false)
const importing = ref(false)
const importError = ref<string | null>(null)
const importResult = ref<ImportResult | null>(null)
const importFile = ref<File | null>(null)

function currentQuery() {
  return {
    search: search.value,
    status: status.value,
    page: page.value,
    pageSize: pageSize.value,
    sort: sort.value,
    direction: direction.value,
  }
}

function onSort(field: string) {
  toggle(field)
  page.value = 1
  void load(currentQuery())
}

onMounted(() => void load())

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
    importResult.value = await membersApi.import(importFile.value)
    importFile.value = null
    await load(currentQuery())
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Gagal mengimpor'
  } finally {
    importing.value = false
  }
}

async function downloadImportTemplate(format: 'csv' | 'xlsx') {
  try {
    await membersApi.importTemplate(format)
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Gagal mengunduh template'
  }
}

function onFilter() {
  page.value = 1
  void load(currentQuery())
}

function onPageChange(target: number) {
  page.value = target
  void load(currentQuery())
}

function onPageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  void load(currentQuery())
}

async function onExport() {
  try {
    await downloadFile(membersApi.exportUrl, 'members.csv')
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Gagal mengekspor'
  }
}

async function submit() {
  if (!selectedPerson.value) {
    formError.value = 'Pilih orang terlebih dahulu.'
    return
  }
  submitting.value = true
  formError.value = null
  try {
    const input: CreateMemberInput = { person_id: selectedPerson.value.id }
    if (joinDate.value) input.join_date = joinDate.value
    if (source.value) input.membership_source = source.value
    await membersApi.create(input)
    showForm.value = false
    selectedPerson.value = null
    joinDate.value = ''
    source.value = ''
    await load(currentQuery())
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Gagal menambah anggota'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Anggota Partai</h1>
        <p v-if="meta" class="text-sm text-slate-500">{{ meta.total }} anggota</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded border border-slate-300 px-3 py-2 text-sm"
          @click="onExport"
        >
          Ekspor CSV
        </button>
        <button
          type="button"
          class="rounded border border-slate-300 px-3 py-2 text-sm"
          @click="showImport = !showImport"
        >
          {{ showImport ? 'Batal' : 'Impor' }}
        </button>
        <button
          type="button"
          class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          @click="showForm = !showForm"
        >
          {{ showForm ? 'Batal' : 'Tambah Anggota' }}
        </button>
      </div>
    </header>

    <div v-if="showImport" class="mb-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <p class="text-sm text-slate-600">
        Unggah berkas CSV atau XLSX. Orang pada tiap baris dicocokkan lewat NIK atau nomor HP; bila belum ada, orang baru dibuat otomatis.
        Baris yang gagal atau duplikat dilewati dan dilaporkan.
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
        <label class="block text-sm font-medium text-slate-700" for="m-join">Tanggal Gabung</label>
        <input id="m-join" v-model="joinDate" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="m-source">Sumber</label>
        <input id="m-source" v-model="source" placeholder="mis. REKRUTMEN" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <p v-if="formError" class="text-sm text-red-600 sm:col-span-2">{{ formError }}</p>
      <button
        type="submit"
        :disabled="submitting"
        class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit"
      >
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <div class="mb-4 flex flex-wrap gap-2">
      <input
        v-model="search"
        placeholder="Cari nama atau nomor anggota"
        class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64"
        @keyup.enter="onFilter"
      />
      <select v-model="status" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="onFilter">
        <option value="">Semua status</option>
        <option v-for="s in MEMBER_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onFilter">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="members.length === 0" class="text-sm text-slate-500">Belum ada anggota.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[58rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <SortableTh field="member_number" label="No. Anggota" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="full_name" label="Nama" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="city_name" label="Kabupaten/Kota" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="district_name" label="Kecamatan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="village_name" label="Kelurahan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="status" label="Status" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="join_date" label="Tgl Gabung" :active="sort" :direction="direction" @sort="onSort" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ member.member_number }}</td>
            <td class="py-2 pr-4">
              <router-link :to="`/members/${member.id}`" class="text-brand-600 hover:underline">
                {{ member.full_name }}
              </router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ member.city_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ member.district_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ member.village_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ memberStatusLabel(member.status) }}</td>
            <td class="py-2 text-slate-600">{{ member.join_date || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
  </section>
</template>
