<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import FilterSelect from '@/components/FilterSelect.vue'
import FilterTextInput from '@/components/FilterTextInput.vue'
import ImportPanel from '@/components/ImportPanel.vue'
import Pagination from '@/components/Pagination.vue'
import SortableTh from '@/components/SortableTh.vue'
import PersonPicker from '@/components/PersonPicker.vue'
import { regionsApi } from '@/modules/people/api'
import type { Person } from '@/modules/people/types'
import { affiliationsApi } from '../api'
import { useSort } from '@/composables/useSort'
import {
  AFFILIATION_STATUSES,
  AFFILIATION_TYPES,
  affiliationTypeLabel,
  type Affiliation,
  type ImportResult,
  type PageMeta,
} from '../types'

const affiliations = ref<Affiliation[]>([])
const meta = ref<PageMeta | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const fullName = ref('')
const personCode = ref('')
const typeFilter = ref('')
const city = ref('')
const district = ref('')
const village = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = ref(10)
const { sort, direction, toggle } = useSort()

const showForm = ref(false)
const submitting = ref(false)
const selectedPerson = ref<Person | null>(null)
const form = reactive({ affiliation_type: AFFILIATION_TYPES[0].value, end_date: '', source: '', notes: '' })

const showImport = ref(false)
const importing = ref(false)
const importError = ref<string | null>(null)
const importResult = ref<ImportResult | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data, meta: pageMeta } = await affiliationsApi.list({
      fullName: fullName.value,
      personCode: personCode.value,
      type: typeFilter.value,
      city: city.value,
      district: district.value,
      village: village.value,
      status: statusFilter.value,
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

const cityOptions = ref<{ value: string; label: string }[]>([])

async function loadCityOptions() {
  try {
    const cities = await regionsApi.cities('')
    cityOptions.value = cities.map((c) => ({ value: c.name, label: c.name }))
  } catch {
    cityOptions.value = []
  }
}

onMounted(() => {
  void load()
  void loadCityOptions()
})

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

async function onImport(file: File) {
  importing.value = true
  importError.value = null
  importResult.value = null
  try {
    importResult.value = await affiliationsApi.import(file)
    await load()
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Gagal mengimpor'
  } finally {
    importing.value = false
  }
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
      end_date: form.end_date || undefined,
      source: form.source || undefined,
      notes: form.notes || undefined,
    })
    showForm.value = false
    selectedPerson.value = null
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
          {{ showImport ? 'Tutup Impor' : 'Impor' }}
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

    <ImportPanel
      v-if="showImport"
      template-path="/api/v1/affiliations/import/template"
      template-filename="template-non-kader"
      :busy="importing"
      :result="importResult"
      :error="importError"
      @import="onImport"
    />

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

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[60rem] border-collapse text-sm">
        <thead class="sticky top-0 z-10 bg-white">
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <SortableTh field="person_code" label="Kode" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="full_name" label="Nama" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="affiliation_type" label="Jenis" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="city_name" label="Kabupaten/Kota" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="district_name" label="Kecamatan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="village_name" label="Kelurahan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="status" label="Status" :active="sort" :direction="direction" @sort="onSort" />
          </tr>
          <tr class="border-b border-slate-200">
            <th class="pb-2 pr-4"><FilterTextInput v-model="personCode" label="Filter kode" placeholder="Cari kode" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="fullName" label="Filter nama" placeholder="Cari nama" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4">
              <FilterSelect
                v-model="typeFilter"
                label="Filter jenis"
                all-label="Semua jenis"
                :options="AFFILIATION_TYPES"
                @change="onFilter"
              />
            </th>
            <th class="pb-2 pr-4">
              <FilterSelect
                v-model="city"
                label="Filter kabupaten/kota"
                all-label="Semua kab/kota"
                :options="cityOptions"
                @change="onFilter"
              />
            </th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="district" label="Filter kecamatan" placeholder="Cari kecamatan" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="village" label="Filter kelurahan" placeholder="Cari kelurahan" @update:model-value="onFilter" /></th>
            <th class="pb-2">
              <FilterSelect
                v-model="statusFilter"
                label="Filter status"
                all-label="Semua status"
                :options="AFFILIATION_STATUSES"
                @change="onFilter"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in affiliations" :key="item.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ item.person_code }}</td>
            <td class="py-2 pr-4">
              <router-link :to="`/non-party/${item.id}`" class="text-brand-600 hover:underline">{{ item.full_name }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ affiliationTypeLabel(item.affiliation_type) }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ item.city_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ item.district_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ item.village_name || '—' }}</td>
            <td class="py-2 text-slate-600">{{ item.status }}</td>
          </tr>
          <tr v-if="affiliations.length === 0"><td colspan="7" class="py-3 text-slate-500">Belum ada data.</td></tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
  </section>
</template>
