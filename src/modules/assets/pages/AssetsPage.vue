<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import AppModal from '@/components/AppModal.vue'
import Pagination from '@/components/Pagination.vue'
import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { assetsApi } from '../api'
import {
  ASSET_CONDITIONS,
  ASSET_STATUSES,
  assetConditionLabel,
  assetStatusLabel,
  type Asset,
  type AssetCategory,
  type AssetLocation,
  type PageMeta,
} from '../types'

const assets = ref<Asset[]>([])
const meta = ref<PageMeta | null>(null)
const categories = ref<AssetCategory[]>([])
const locations = ref<AssetLocation[]>([])
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = ref(10)

const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')

const blankForm = () => ({
  name: '',
  category_id: '',
  location_id: '',
  organization_unit_id: '',
  acquisition_date: '',
  acquisition_value: '',
  condition: '',
})
const form = reactive(blankForm())

function notify(message: string, title = 'Data Belum Lengkap') {
  modalMessage.value = message
  modalTitle.value = title
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, cats, locs, unitList] = await Promise.all([
      assetsApi.list({ search: search.value, status: statusFilter.value, page: page.value, pageSize: pageSize.value }),
      assetsApi.categories(),
      assetsApi.locations(),
      organizationApi.listUnits({ pageSize: 200 }),
    ])
    assets.value = list.data
    meta.value = list.meta ?? null
    categories.value = cats
    locations.value = locs
    units.value = unitList.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat aset'
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

function onPageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  void load()
}

function validateForm(): string | null {
  const missing: string[] = []
  if (!form.name.trim()) missing.push('Nama Aset')
  if (!form.category_id) missing.push('Kategori')
  if (!form.location_id) missing.push('Lokasi')
  if (!form.organization_unit_id) missing.push('Unit Organisasi')
  if (!form.acquisition_date) missing.push('Tanggal Diperoleh')
  if (!form.acquisition_value) missing.push('Nilai Aset')
  if (!form.condition) missing.push('Kondisi')
  if (missing.length > 0) {
    return `Field berikut wajib diisi: ${missing.join(', ')}.`
  }
  if (Number(form.acquisition_value) <= 0) {
    return 'Nilai Aset harus angka lebih dari 0.'
  }
  return null
}

async function submit() {
  const validation = validateForm()
  if (validation) {
    notify(validation)
    return
  }
  submitting.value = true
  error.value = null
  try {
    await assetsApi.create({
      name: form.name,
      category_id: form.category_id,
      location_id: form.location_id,
      organization_unit_id: form.organization_unit_id,
      acquisition_date: form.acquisition_date,
      acquisition_value: Number(form.acquisition_value),
      condition: form.condition,
    })
    showForm.value = false
    Object.assign(form, blankForm())
    await load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal menyimpan aset', 'Gagal Menyimpan')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Daftar Aset</h1>
        <p class="text-sm text-slate-500">{{ meta?.total ?? assets.length }} aset</p>
      </div>
      <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
        {{ showForm ? 'Batal' : 'Tambah Aset' }}
      </button>
    </header>

    <form v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="submit">
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700" for="a-name">Nama Aset</label>
        <input id="a-name" v-model="form.name" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="a-cat">Kategori</label>
        <select id="a-cat" v-model="form.category_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Pilih kategori</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.code }} - {{ c.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="a-loc">Lokasi</label>
        <select id="a-loc" v-model="form.location_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Pilih lokasi</option>
          <option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="a-unit">Unit Organisasi</label>
        <select id="a-unit" v-model="form.organization_unit_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Pilih unit</option>
          <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="a-date">Tanggal Diperoleh</label>
        <input id="a-date" v-model="form.acquisition_date" type="date" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="a-value">Nilai Aset</label>
        <input id="a-value" v-model="form.acquisition_value" type="number" step="0.01" min="0" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="a-cond">Kondisi</label>
        <select id="a-cond" v-model="form.condition" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Pilih kondisi</option>
          <option v-for="c in ASSET_CONDITIONS" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>
      <button type="submit" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <div class="mb-4 flex flex-wrap gap-2">
      <input v-model="search" placeholder="Cari nama atau kode" class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64" @keyup.enter="onFilter" />
      <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="onFilter">
        <option value="">Semua status</option>
        <option v-for="s in ASSET_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onFilter">Cari</button>
      <router-link to="/assets/categories" class="rounded border border-slate-300 px-3 py-2 text-sm">Pengaturan Aset</router-link>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="assets.length === 0" class="text-sm text-slate-500">Belum ada aset.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Kode</th>
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2 pr-4">Kategori</th>
            <th class="py-2 pr-4">Kondisi</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in assets" :key="a.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ a.asset_code }}</td>
            <td class="py-2 pr-4">
              <router-link :to="`/assets/${a.id}`" class="text-brand-600 hover:underline">{{ a.name }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ a.category_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ assetConditionLabel(a.condition) }}</td>
            <td class="py-2 text-slate-600">{{ assetStatusLabel(a.status) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />

    <AppModal :open="modalMessage !== ''" :title="modalTitle" :message="modalMessage" @close="modalMessage = ''" />
  </section>
</template>
