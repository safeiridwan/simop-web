<script setup lang="ts">
import { onMounted, ref } from 'vue'

import Pagination from '@/components/Pagination.vue'
import PersonForm from '../components/PersonForm.vue'
import { useAuthStore } from '@/app/stores/auth'
import { peopleApi } from '../api'
import type { ImportResult, Person, PersonInput, PersonSecrets } from '../types'
import { usePeople } from '../composables/usePeople'

const auth = useAuthStore()
const { people, meta, loading, error, load } = usePeople()

const search = ref('')
const status = ref('')
const page = ref(1)
const pageSize = ref(10)
const showForm = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)

const secrets = ref<Record<string, PersonSecrets>>({})
const showNik = ref<Record<string, boolean>>({})
const showPhone = ref<Record<string, boolean>>({})

async function ensureSecrets(id: string) {
  if (secrets.value[id]) return
  secrets.value[id] = await peopleApi.reveal(id)
}

async function toggleNik(person: Person) {
  if (showNik.value[person.id]) {
    showNik.value[person.id] = false
    return
  }
  try {
    await ensureSecrets(person.id)
    showNik.value[person.id] = true
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Gagal membuka NIK'
  }
}

async function togglePhone(person: Person) {
  if (showPhone.value[person.id]) {
    showPhone.value[person.id] = false
    return
  }
  try {
    await ensureSecrets(person.id)
    showPhone.value[person.id] = true
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Gagal membuka telepon'
  }
}

function nikDisplay(person: Person): string {
  return showNik.value[person.id] ? secrets.value[person.id]?.nik || '—' : person.nik_masked || '—'
}

function phoneDisplay(person: Person): string {
  return showPhone.value[person.id] ? secrets.value[person.id]?.phone || '—' : person.phone_masked || '—'
}

function reload() {
  secrets.value = {}
  showNik.value = {}
  showPhone.value = {}
  void load(search.value, status.value, page.value, pageSize.value)
}

const showImport = ref(false)
const importing = ref(false)
const importError = ref<string | null>(null)
const importResult = ref<ImportResult | null>(null)
const importFile = ref<File | null>(null)

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
    importResult.value = await peopleApi.importPeople(importFile.value)
    importFile.value = null
    await load(search.value, status.value, page.value, pageSize.value)
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Gagal mengimpor'
  } finally {
    importing.value = false
  }
}

async function downloadTemplate(format: 'csv' | 'xlsx') {
  try {
    await peopleApi.importTemplate(format)
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Gagal mengunduh template'
  }
}

function onFilter() {
  page.value = 1
  reload()
}

function onPageChange(target: number) {
  page.value = target
  reload()
}

function onPageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  reload()
}

async function onCreate(input: PersonInput) {
  submitting.value = true
  formError.value = null
  try {
    await peopleApi.create(input)
    showForm.value = false
    await load(search.value, status.value, page.value, pageSize.value)
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Gagal menyimpan'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Semua Orang</h1>
        <p v-if="meta" class="text-sm text-slate-500">{{ meta.total }} data</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded border border-slate-300 px-3 py-2 text-sm sm:w-fit"
          @click="showImport = !showImport"
        >
          {{ showImport ? 'Batal' : 'Impor' }}
        </button>
        <button
          type="button"
          class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit"
          @click="showForm = !showForm"
        >
          {{ showForm ? 'Batal' : 'Tambah Orang' }}
        </button>
      </div>
    </header>

    <div v-if="showForm" class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <p v-if="formError" class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{{ formError }}</p>
      <PersonForm :submitting="submitting" submit-label="Simpan" duplicate-check @submit="onCreate" />
    </div>

    <div v-if="showImport" class="mb-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <p class="text-sm text-slate-600">
        Unggah berkas CSV atau XLSX. Baris dengan NIK duplikat atau tidak valid akan dilewati dan dilaporkan.
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-slate-500">Template:</span>
        <button type="button" class="text-sm text-brand-600 hover:underline" @click="downloadTemplate('csv')">CSV</button>
        <button type="button" class="text-sm text-brand-600 hover:underline" @click="downloadTemplate('xlsx')">XLSX</button>
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
        <p class="text-slate-700">
          Selesai: {{ importResult.created }} dibuat, {{ importResult.skipped }} dilewati.
        </p>
        <ul v-if="importResult.errors.length" class="mt-2 space-y-1 text-xs text-red-600">
          <li v-for="e in importResult.errors" :key="e.row">Baris {{ e.row }}: {{ e.message }}</li>
        </ul>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <input
        v-model="search"
        placeholder="Cari nama atau kode"
        class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64"
        @keyup.enter="onFilter"
      />
      <select v-model="status" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="onFilter">
        <option value="">Semua status</option>
        <option value="ACTIVE">Aktif</option>
        <option value="INACTIVE">Tidak aktif</option>
        <option value="DECEASED">Meninggal</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onFilter">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="people.length === 0" class="text-sm text-slate-500">Belum ada data orang.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Kode</th>
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2 pr-4">NIK</th>
            <th class="py-2 pr-4">Telepon</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="person in people" :key="person.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ person.person_code }}</td>
            <td class="py-2 pr-4">
              <router-link :to="`/people/${person.id}`" class="text-brand-600 hover:underline">
                {{ person.full_name }}
              </router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">
              <span class="inline-flex items-center gap-1">
                <span class="font-mono text-xs">{{ nikDisplay(person) }}</span>
                <button
                  v-if="auth.isSuperAdmin"
                  type="button"
                  :aria-label="showNik[person.id] ? 'Sembunyikan NIK' : 'Tampilkan NIK'"
                  class="text-slate-400 hover:text-slate-700"
                  @click="toggleNik(person)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    <path v-if="!showNik[person.id]" stroke-linecap="round" d="M4 4l16 16" />
                  </svg>
                </button>
              </span>
            </td>
            <td class="py-2 pr-4 text-slate-600">
              <span class="inline-flex items-center gap-1">
                <span class="font-mono text-xs">{{ phoneDisplay(person) }}</span>
                <button
                  v-if="auth.isSuperAdmin"
                  type="button"
                  :aria-label="showPhone[person.id] ? 'Sembunyikan telepon' : 'Tampilkan telepon'"
                  class="text-slate-400 hover:text-slate-700"
                  @click="togglePhone(person)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    <path v-if="!showPhone[person.id]" stroke-linecap="round" d="M4 4l16 16" />
                  </svg>
                </button>
              </span>
            </td>
            <td class="py-2 text-slate-600">{{ person.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
  </section>
</template>
