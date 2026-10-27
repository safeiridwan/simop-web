<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import FilterSelect from '@/components/FilterSelect.vue'
import FilterTextInput from '@/components/FilterTextInput.vue'
import ImportPanel from '@/components/ImportPanel.vue'
import Pagination from '@/components/Pagination.vue'
import SortableTh from '@/components/SortableTh.vue'
import PersonPicker from '@/components/PersonPicker.vue'
import type { Person } from '@/modules/people/types'
import { cadreApi } from '../api'
import { useSort } from '@/composables/useSort'
import { CADRE_STATUSES, type CadreLevel, type CadreProfile, type ImportResult, type PageMeta } from '../types'

const cadres = ref<CadreProfile[]>([])
const levels = ref<CadreLevel[]>([])
const meta = ref<PageMeta | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const showForm = ref(false)
const submitting = ref(false)
const selectedPerson = ref<Person | null>(null)
const form = reactive({ level_id: '', started_at: '', notes: '' })

const showImport = ref(false)
const importing = ref(false)
const importError = ref<string | null>(null)
const importResult = ref<ImportResult | null>(null)

const fullName = ref('')
const personCode = ref('')
const levelFilter = ref('')
const city = ref('')
const district = ref('')
const village = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = ref(10)
const { sort, direction, toggle } = useSort()

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, levelList] = await Promise.all([
      cadreApi.list({
        fullName: fullName.value,
        personCode: personCode.value,
        levelId: levelFilter.value,
        city: city.value,
        district: district.value,
        village: village.value,
        status: statusFilter.value,
        page: page.value,
        pageSize: pageSize.value,
        sort: sort.value,
        direction: direction.value,
      }),
      cadreApi.levels(),
    ])
    cadres.value = list.data
    meta.value = list.meta ?? null
    levels.value = levelList
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat data kader'
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

async function onImport(file: File) {
  importing.value = true
  importError.value = null
  importResult.value = null
  try {
    importResult.value = await cadreApi.import(file)
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
    await cadreApi.create({
      person_id: selectedPerson.value.id,
      level_id: form.level_id,
      started_at: form.started_at || undefined,
      notes: form.notes || undefined,
    })
    showForm.value = false
    selectedPerson.value = null
    form.level_id = ''
    form.started_at = ''
    form.notes = ''
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan kader'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Kader</h1>
        <p class="text-sm text-slate-500">{{ meta?.total ?? cadres.length }} kader</p>
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
          {{ showForm ? 'Batal' : 'Tambah Kader' }}
        </button>
      </div>
    </header>

    <ImportPanel
      v-if="showImport"
      template-path="/api/v1/cadres/import/template"
      template-filename="template-kader"
      :busy="importing"
      :result="importResult"
      :error="importError"
      @import="onImport"
    />

    <div v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700">Orang</label>
        <PersonPicker v-model="selectedPerson" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="c-level">Jenjang Awal</label>
        <select id="c-level" v-model="form.level_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Pilih jenjang</option>
          <option v-for="l in levels" :key="l.id" :value="l.id">{{ l.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="c-start">Mulai</label>
        <input id="c-start" v-model="form.started_at" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div class="sm:col-span-2">
        <button type="button" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="submit">
          {{ submitting ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </div>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[56rem] border-collapse text-sm">
        <thead class="sticky top-0 z-10 bg-white">
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <SortableTh field="full_name" label="Nama" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="person_code" label="Kode" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="level_name" label="Jenjang" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="city_name" label="Kabupaten/Kota" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="district_name" label="Kecamatan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="village_name" label="Kelurahan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="status" label="Status" :active="sort" :direction="direction" @sort="onSort" />
          </tr>
          <tr class="border-b border-slate-200">
            <th class="pb-2 pr-4"><FilterTextInput v-model="fullName" label="Filter nama" placeholder="Cari nama" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="personCode" label="Filter kode" placeholder="Cari kode" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4">
              <FilterSelect
                v-model="levelFilter"
                label="Filter jenjang"
                all-label="Semua jenjang"
                :options="levels.map((l) => ({ value: l.id, label: l.name }))"
                @change="onFilter"
              />
            </th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="city" label="Filter kabupaten/kota" placeholder="Cari kab/kota" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="district" label="Filter kecamatan" placeholder="Cari kecamatan" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="village" label="Filter kelurahan" placeholder="Cari kelurahan" @update:model-value="onFilter" /></th>
            <th class="pb-2">
              <FilterSelect
                v-model="statusFilter"
                label="Filter status"
                all-label="Semua status"
                :options="CADRE_STATUSES"
                @change="onFilter"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in cadres" :key="c.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4">
              <router-link :to="`/cadres/${c.id}`" class="text-brand-600 hover:underline">{{ c.full_name }}</router-link>
            </td>
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ c.person_code }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ c.level_name }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ c.city_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ c.district_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ c.village_name || '—' }}</td>
            <td class="py-2 text-slate-600">{{ c.status }}</td>
          </tr>
          <tr v-if="cadres.length === 0"><td colspan="7" class="py-3 text-slate-500">Belum ada data.</td></tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
  </section>
</template>
