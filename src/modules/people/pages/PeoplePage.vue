<script setup lang="ts">
import { onMounted, ref } from 'vue'

import FilterSelect from '@/components/FilterSelect.vue'
import FilterTextInput from '@/components/FilterTextInput.vue'
import ImportPanel from '@/components/ImportPanel.vue'
import Pagination from '@/components/Pagination.vue'
import SortableTh from '@/components/SortableTh.vue'
import PersonForm from '../components/PersonForm.vue'
import { useAuthStore } from '@/app/stores/auth'
import { peopleApi } from '../api'
import type { ImportResult, Person, PersonInput, PersonSecrets } from '../types'
import { usePeople } from '../composables/usePeople'
import { useSort } from '@/composables/useSort'

const auth = useAuthStore()
const { people, meta, loading, error, load } = usePeople()

const fullName = ref('')
const personCode = ref('')
const city = ref('')
const district = ref('')
const village = ref('')
const status = ref('')
const page = ref(1)
const pageSize = ref(10)
const { sort, direction, toggle } = useSort()
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

function currentQuery() {
  return {
    fullName: fullName.value,
    personCode: personCode.value,
    city: city.value,
    district: district.value,
    village: village.value,
    status: status.value,
    page: page.value,
    pageSize: pageSize.value,
    sort: sort.value,
    direction: direction.value,
  }
}

function reload() {
  secrets.value = {}
  showNik.value = {}
  showPhone.value = {}
  void load(currentQuery())
}

function onSort(field: string) {
  toggle(field)
  page.value = 1
  reload()
}

const showImport = ref(false)
const importing = ref(false)
const importError = ref<string | null>(null)
const importResult = ref<ImportResult | null>(null)

onMounted(() => void load())

async function onImport(file: File) {
  importing.value = true
  importError.value = null
  importResult.value = null
  try {
    importResult.value = await peopleApi.importPeople(file)
    await load(currentQuery())
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Gagal mengimpor'
  } finally {
    importing.value = false
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
    await load(currentQuery())
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
          {{ showImport ? 'Tutup Impor' : 'Impor' }}
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

    <ImportPanel
      v-if="showImport"
      template-path="/api/v1/persons/import/template"
      template-filename="template-orang"
      :busy="importing"
      :result="importResult"
      :error="importError"
      @import="onImport"
    />

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[60rem] border-collapse text-sm">
        <thead class="sticky top-0 z-10 bg-white">
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <SortableTh field="person_code" label="Kode" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="full_name" label="Nama" :active="sort" :direction="direction" @sort="onSort" />
            <th class="py-2 pr-4">NIK</th>
            <th class="py-2 pr-4">Telepon</th>
            <SortableTh field="city_name" label="Kabupaten/Kota" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="district_name" label="Kecamatan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="village_name" label="Kelurahan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="status" label="Status" :active="sort" :direction="direction" @sort="onSort" />
          </tr>
          <tr class="border-b border-slate-200">
            <th class="pb-2 pr-4"><FilterTextInput v-model="personCode" label="Filter kode" placeholder="Cari kode" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="fullName" label="Filter nama" placeholder="Cari nama" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"></th>
            <th class="pb-2 pr-4"></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="city" label="Filter kabupaten/kota" placeholder="Cari kab/kota" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="district" label="Filter kecamatan" placeholder="Cari kecamatan" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="village" label="Filter kelurahan" placeholder="Cari kelurahan" @update:model-value="onFilter" /></th>
            <th class="pb-2">
              <FilterSelect
                v-model="status"
                label="Filter status"
                all-label="Semua status"
                :options="[
                  { value: 'ACTIVE', label: 'Aktif' },
                  { value: 'INACTIVE', label: 'Tidak aktif' },
                  { value: 'DECEASED', label: 'Meninggal' },
                ]"
                @change="onFilter"
              />
            </th>
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
            <td class="py-2 pr-4 text-slate-600">{{ person.city_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ person.district_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ person.village_name || '—' }}</td>
            <td class="py-2 text-slate-600">{{ person.status }}</td>
          </tr>
          <tr v-if="people.length === 0"><td colspan="8" class="py-3 text-slate-500">Belum ada data.</td></tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
  </section>
</template>
