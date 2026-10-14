<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import AppModal from '@/components/AppModal.vue'
import AssetItemRows from '@/components/AssetItemRows.vue'
import FileDropzone from '@/components/FileDropzone.vue'
import Pagination from '@/components/Pagination.vue'
import { formatDate } from '@/utils/date'
import { assetsApi } from '../api'
import {
  TRANSACTION_STATUSES,
  conditionsTotal,
  transactionAssetsLabel,
  transactionStatusLabel,
  type AssetCategory,
  type AssetTransaction,
  type PageMeta,
  type TransactionItemInput,
} from '../types'

const transactions = ref<AssetTransaction[]>([])
const meta = ref<PageMeta | null>(null)
const categories = ref<AssetCategory[]>([])
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

const photoFile = ref<File | null>(null)
const items = ref<TransactionItemInput[]>([])

const blankForm = () => ({
  borrower_name: '',
  borrower_nik: '',
  borrower_phone: '',
  borrower_address: '',
  borrow_date: '',
  return_estimate_date: '',
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
    const [list, cats] = await Promise.all([
      assetsApi.listTransactions({ search: search.value, status: statusFilter.value, page: page.value, pageSize: pageSize.value }),
      assetsApi.categories(),
    ])
    transactions.value = list.data
    meta.value = list.meta ?? null
    categories.value = cats
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat transaksi'
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

function resetForm() {
  Object.assign(form, blankForm())
  items.value = []
  photoFile.value = null
}

function validateForm(): string | null {
  const missing: string[] = []
  if (!form.borrower_name.trim()) missing.push('Nama Lengkap')
  if (!form.borrower_nik.trim()) missing.push('NIK')
  if (!form.borrower_phone.trim()) missing.push('No HP')
  if (!form.borrower_address.trim()) missing.push('Alamat Domisili')
  if (!form.borrow_date) missing.push('Tanggal Pinjam')
  if (!form.return_estimate_date) missing.push('Tanggal Kembali')
  if (missing.length > 0) {
    return `Field berikut wajib diisi: ${missing.join(', ')}.`
  }
  if (form.return_estimate_date < form.borrow_date) {
    return 'Tanggal kembali tidak boleh lebih kecil dari tanggal pinjam.'
  }
  if (!/^[0-9]{16}$/.test(form.borrower_nik.trim())) {
    return 'NIK harus berupa 16 digit angka.'
  }
  if (items.value.length === 0) {
    return 'Tambahkan minimal satu baris aset yang dipinjam.'
  }
  for (const item of items.value) {
    if (!item.category_id) return 'Setiap baris aset harus memilih Kategori Aset.'
    if (!item.quantity || item.quantity <= 0) return 'Jumlah Unit harus bilangan bulat lebih dari 0.'
    if (conditionsTotal(item.conditions) !== item.quantity) {
      return 'Total rincian kondisi harus sama dengan jumlah unit pada setiap baris.'
    }
  }
  if (!photoFile.value) {
    return 'Foto Aset yang Dipinjam wajib diunggah.'
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
    const uploaded = await assetsApi.uploadNewTransactionPhoto(photoFile.value as File)
    await assetsApi.createTransaction({
      borrower_name: form.borrower_name,
      borrower_nik: form.borrower_nik,
      borrower_phone: form.borrower_phone,
      borrower_address: form.borrower_address,
      borrow_date: form.borrow_date,
      return_estimate_date: form.return_estimate_date,
      borrow_photo_file_id: uploaded.file_id,
      items: items.value,
    })
    showForm.value = false
    resetForm()
    await load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal menyimpan transaksi', 'Gagal Menyimpan')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Transaksi Aset</h1>
        <p class="text-sm text-slate-500">{{ meta?.total ?? transactions.length }} transaksi</p>
      </div>
      <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
        {{ showForm ? 'Batal' : 'Tambah Permintaan' }}
      </button>
    </header>

    <form v-if="showForm" class="mb-6 space-y-4 rounded-lg border border-slate-200 bg-white p-4" @submit.prevent="submit">
      <h2 class="font-semibold text-slate-900">Identitas Peminjam</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-slate-700" for="t-name">Nama Lengkap</label>
          <input id="t-name" v-model="form.borrower_name" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700" for="t-nik">NIK</label>
          <input id="t-nik" v-model="form.borrower_nik" maxlength="16" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700" for="t-phone">No HP</label>
          <input id="t-phone" v-model="form.borrower_phone" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700" for="t-addr">Alamat Domisili</label>
          <input id="t-addr" v-model="form.borrower_address" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <h2 class="font-semibold text-slate-900">Peminjaman Aset</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-slate-700" for="t-borrow">Tanggal Pinjam</label>
          <input id="t-borrow" v-model="form.borrow_date" type="date" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700" for="t-return">Tanggal Kembali</label>
          <input id="t-return" v-model="form.return_estimate_date" type="date" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <AssetItemRows v-model="items" :categories="categories" :disabled="submitting" />

      <div>
        <label class="block text-sm font-medium text-slate-700">Foto Aset yang Dipinjam</label>
        <div class="mt-1">
          <FileDropzone :disabled="submitting" @update:file="photoFile = $event" />
        </div>
      </div>

      <button type="submit" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:w-fit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <div class="mb-4 flex flex-wrap gap-2">
      <input v-model="search" placeholder="Cari kode atau peminjam" class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64" @keyup.enter="onFilter" />
      <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="onFilter">
        <option value="">Semua status</option>
        <option v-for="s in TRANSACTION_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onFilter">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="transactions.length === 0" class="text-sm text-slate-500">Belum ada transaksi.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[52rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Kode Transaksi</th>
            <th class="py-2 pr-4">Kode Unit Aset - Kategori</th>
            <th class="py-2 pr-4">Identitas Peminjam</th>
            <th class="py-2 pr-4">Tanggal Pinjam</th>
            <th class="py-2 pr-4">Tanggal Estimasi Kembali</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in transactions" :key="t.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">
              <router-link :to="`/assets/transactions/${t.id}`" class="text-brand-600 hover:underline">{{ t.transaction_code }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ transactionAssetsLabel(t) }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ t.borrower_nik }} - {{ t.borrower_name }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ formatDate(t.borrow_date) }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ formatDate(t.return_estimate_date) }}</td>
            <td class="py-2 text-slate-600">{{ transactionStatusLabel(t.status) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />

    <AppModal :open="modalMessage !== ''" :title="modalTitle" :message="modalMessage" @close="modalMessage = ''" />
  </section>
</template>
