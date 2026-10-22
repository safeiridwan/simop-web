<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'

import AppModal from '@/components/AppModal.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'
import FilterDateRange from '@/components/FilterDateRange.vue'
import FilterTextInput from '@/components/FilterTextInput.vue'
import ImportPanel from '@/components/ImportPanel.vue'
import Pagination from '@/components/Pagination.vue'
import SortableTh from '@/components/SortableTh.vue'
import { downloadFile, HttpError } from '@/services/http'
import { useSort } from '@/composables/useSort'
import { formatDateRange } from '@/utils/date'
import { formatRupiah } from '@/utils/currency'
import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { programsApi } from '../api'
import {
  PROGRAM_STATUSES,
  PROGRAM_TYPES,
  programStatusLabel,
  truncateFilename,
  type ImportResult,
  type PageMeta,
  type Program,
} from '../types'

const programs = ref<Program[]>([])
const meta = ref<PageMeta | null>(null)
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const showForm = ref(false)
const submitting = ref(false)
const page = ref(1)
const pageSize = ref(10)

const nameFilter = ref('')
const unitFilter = ref('')
const statusFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const dateError = ref('')
const { sort, direction, toggle } = useSort()

const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')

const showImport = ref(false)
const importing = ref(false)
const importResult = ref<ImportResult | null>(null)
const importError = ref<string | null>(null)

const form = reactive({
  organization_unit_id: '',
  name: '',
  objective: '',
  program_type: '',
  start_date: '',
  end_date: '',
  planned_amount: null as number | null,
})

function notify(message: string, title = 'Pemberitahuan') {
  modalMessage.value = message
  modalTitle.value = title
}

async function load() {
  if (dateFrom.value && dateTo.value && dateFrom.value > dateTo.value) {
    dateError.value = 'Tanggal awal tidak boleh lebih besar dari tanggal akhir.'
    loading.value = false
    return
  }
  dateError.value = ''
  loading.value = true
  error.value = null
  try {
    const [list, unitList] = await Promise.all([
      programsApi.list({
        name: nameFilter.value || undefined,
        status: statusFilter.value || undefined,
        organizationUnitId: unitFilter.value || undefined,
        dateFrom: dateFrom.value || undefined,
        dateTo: dateTo.value || undefined,
        sort: sort.value,
        direction: direction.value,
        page: page.value,
        pageSize: pageSize.value,
      }),
      organizationApi.listUnits({ pageSize: 200 }),
    ])
    programs.value = list.data
    meta.value = list.meta ?? null
    units.value = unitList.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat program'
  } finally {
    loading.value = false
  }
}

onMounted(load)

// FilterTextInput debounces typing; each settled value resets to page 1.
watch(nameFilter, () => {
  page.value = 1
  void load()
})

function onFilterChange() {
  page.value = 1
  void load()
}

function onSort(field: string) {
  toggle(field)
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

function resetForm() {
  form.organization_unit_id = ''
  form.name = ''
  form.objective = ''
  form.program_type = ''
  form.start_date = ''
  form.end_date = ''
  form.planned_amount = null
}

function validateForm(): string | null {
  const missing: string[] = []
  if (!form.organization_unit_id) missing.push('Unit Organisasi')
  if (!form.name.trim()) missing.push('Nama')
  if (!form.objective.trim()) missing.push('Tujuan')
  if (!form.program_type) missing.push('Tipe Program')
  if (!form.start_date) missing.push('Tanggal Pelaksanaan')
  if (!form.end_date) missing.push('Tanggal Pelaksanaan')
  if (form.planned_amount == null) missing.push('Rencana Anggaran')
  if (missing.length > 0) {
    return `Field berikut wajib diisi: ${[...new Set(missing)].join(', ')}.`
  }
  if (form.start_date > form.end_date) {
    return 'Tanggal mulai tidak boleh lebih besar dari tanggal selesai.'
  }
  if (!(form.planned_amount! > 0)) {
    return 'Rencana Anggaran wajib diisi dan harus lebih dari 0.'
  }
  return null
}

async function submit() {
  const validation = validateForm()
  if (validation) {
    notify(validation, 'Data Belum Lengkap')
    return
  }
  submitting.value = true
  error.value = null
  try {
    await programsApi.create({
      organization_unit_id: form.organization_unit_id,
      name: form.name,
      objective: form.objective,
      program_type: form.program_type,
      start_date: form.start_date,
      end_date: form.end_date,
      planned_amount: form.planned_amount!,
    })
    showForm.value = false
    resetForm()
    await load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal menyimpan program', 'Gagal Menyimpan')
  } finally {
    submitting.value = false
  }
}

async function download(fileId: string, filename: string) {
  try {
    await downloadFile(`/api/v1/files/${fileId}`, filename)
  } catch (err) {
    notify(err instanceof HttpError ? err.message : 'Gagal mengunduh berkas', 'Gagal Mengunduh')
  }
}

async function onImport(file: File) {
  importing.value = true
  importResult.value = null
  importError.value = null
  try {
    importResult.value = await programsApi.import(file)
    if (importResult.value.created > 0) await load()
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Gagal mengimpor'
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Semua Program</h1>
        <p class="text-sm text-slate-500">{{ meta?.total ?? programs.length }} program</p>
      </div>
      <div class="flex gap-2">
        <button type="button" class="rounded border border-brand-500 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 sm:w-fit" @click="showImport = !showImport">
          {{ showImport ? 'Tutup Impor' : 'Impor' }}
        </button>
        <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
          {{ showForm ? 'Batal' : 'Tambah Program' }}
        </button>
      </div>
    </header>

    <ImportPanel
      v-if="showImport"
      template-path="/api/v1/programs/import/template"
      template-filename="template-program"
      :busy="importing"
      :result="importResult"
      :error="importError"
      @import="onImport"
    />

    <div v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-unit">Unit Organisasi</label>
        <select id="p-unit" v-model="form.organization_unit_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Pilih unit</option>
          <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }} ({{ u.code }})</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-name">Nama</label>
        <input id="p-name" v-model="form.name" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700" for="p-obj">Tujuan</label>
        <input id="p-obj" v-model="form.objective" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-type">Tipe Program</label>
        <select id="p-type" v-model="form.program_type" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Pilih tipe</option>
          <option v-for="t in PROGRAM_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-planned">Rencana Anggaran</label>
        <CurrencyInput id="p-planned" v-model="form.planned_amount" class="mt-1" />
      </div>
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700">Tanggal Pelaksanaan</label>
        <div class="mt-1 flex flex-wrap items-center gap-2">
          <input v-model="form.start_date" type="date" required class="rounded border border-slate-300 px-3 py-2 text-sm" aria-label="Tanggal mulai pelaksanaan" />
          <span class="text-sm text-slate-500">s/d</span>
          <input v-model="form.end_date" type="date" required class="rounded border border-slate-300 px-3 py-2 text-sm" aria-label="Tanggal selesai pelaksanaan" />
        </div>
        <p class="mt-1 text-xs text-slate-500">Isi tanggal yang sama untuk kegiatan satu hari.</p>
      </div>
      <button type="button" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit" @click="submit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="programs.length === 0 && !dateError" class="text-sm text-slate-500">Belum ada program.</p>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[70rem] border-collapse text-sm">
        <thead class="sticky top-0 z-10 bg-white">
          <tr class="border-b border-slate-200 text-slate-500">
            <SortableTh field="program_code" label="Kode" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="name" label="Nama" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="unit" label="Unit" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="start_date" label="Tanggal Pelaksanaan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="planned_amount" label="Rencana Anggaran" :active="sort" :direction="direction" align="right" @sort="onSort" />
            <th class="py-2 pr-4">Proposal</th>
            <SortableTh field="requested_amount" label="Komitmen Anggaran" :active="sort" :direction="direction" align="right" @sort="onSort" />
            <th class="py-2 pr-4">LPJ</th>
            <SortableTh field="actual_amount" label="Realisasi Anggaran" :active="sort" :direction="direction" align="right" @sort="onSort" />
            <SortableTh field="status" label="Status" :active="sort" :direction="direction" @sort="onSort" />
          </tr>
          <tr class="border-b border-slate-200">
            <th class="pb-2 pr-4"></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="nameFilter" label="Filter nama" placeholder="Cari nama" /></th>
            <th class="pb-2 pr-4">
              <select v-model="unitFilter" class="w-full rounded border border-slate-300 px-2 py-1 text-xs font-normal" aria-label="Filter unit" @change="onFilterChange">
                <option value="">Semua unit</option>
                <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </th>
            <th class="pb-2 pr-4">
              <FilterDateRange v-model:from="dateFrom" v-model:to="dateTo" label="Filter tanggal pelaksanaan" @change="onFilterChange" />
            </th>
            <th class="pb-2 pr-4"></th>
            <th class="pb-2 pr-4"></th>
            <th class="pb-2 pr-4"></th>
            <th class="pb-2 pr-4"></th>
            <th class="pb-2 pr-4"></th>
            <th class="pb-2">
              <select v-model="statusFilter" class="w-full rounded border border-slate-300 px-2 py-1 text-xs font-normal" aria-label="Filter status" @change="onFilterChange">
                <option value="">Semua status</option>
                <option v-for="s in PROGRAM_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in programs" :key="p.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ p.program_code }}</td>
            <td class="py-2 pr-4">
              <router-link :to="`/programs/${p.id}`" class="text-brand-600 hover:underline">{{ p.name }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ p.organization_unit_name }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ formatDateRange(p.start_date, p.end_date) }}</td>
            <td class="py-2 pr-4 text-right text-slate-600">{{ formatRupiah(p.planned_amount) }}</td>
            <td class="py-2 pr-4">
              <button
                v-if="p.proposal_file_id && p.proposal_file_name"
                type="button"
                class="text-brand-600 hover:underline"
                :title="p.proposal_file_name"
                @click="download(p.proposal_file_id, p.proposal_file_name)"
              >
                {{ truncateFilename(p.proposal_file_name) }}
              </button>
              <span v-else class="text-slate-400">-</span>
            </td>
            <td class="py-2 pr-4 text-right text-slate-600">{{ formatRupiah(p.requested_amount) }}</td>
            <td class="py-2 pr-4">
              <button
                v-if="p.lpj_file_id && p.lpj_file_name"
                type="button"
                class="text-brand-600 hover:underline"
                :title="p.lpj_file_name"
                @click="download(p.lpj_file_id, p.lpj_file_name)"
              >
                {{ truncateFilename(p.lpj_file_name) }}
              </button>
              <span v-else class="text-slate-400">-</span>
            </td>
            <td class="py-2 pr-4 text-right text-slate-600">{{ formatRupiah(p.actual_amount) }}</td>
            <td class="py-2 text-slate-600">{{ programStatusLabel(p.status) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />

    <AppModal :open="modalMessage !== ''" :title="modalTitle" :message="modalMessage" @close="modalMessage = ''" />
  </section>
</template>
