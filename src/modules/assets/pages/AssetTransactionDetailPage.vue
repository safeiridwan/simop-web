<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppModal from '@/components/AppModal.vue'
import AssetItemRows from '@/components/AssetItemRows.vue'
import FileDropzone from '@/components/FileDropzone.vue'
import { useAuthStore } from '@/app/stores/auth'
import { downloadFile } from '@/services/http'
import { assetsApi } from '../api'
import {
  TRANSACTION_TRANSITIONS,
  canEditTransaction,
  canEditReturn,
  conditionSummary,
  conditionsTotal,
  returnVisible,
  transactionStatusLabel,
  type AssetCategory,
  type AssetTransactionDetail,
  type TransactionItem,
  type TransactionItemInput,
} from '../types'

const route = useRoute()
const auth = useAuthStore()
const id = route.params.id as string

const detail = ref<AssetTransactionDetail | null>(null)
const categories = ref<AssetCategory[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')
const confirmMessage = ref('')
let confirmAction: (() => Promise<void>) | null = null

const editingBorrow = ref(false)
const editingReturn = ref(false)

const borrowForm = reactive({
  borrower_name: '',
  borrower_nik: '',
  borrower_phone: '',
  borrower_address: '',
  borrow_date: '',
  return_estimate_date: '',
})
const borrowItems = ref<TransactionItemInput[]>([])
const borrowPhoto = ref<File | null>(null)

const returnForm = reactive({ actual_return_date: '' })
const returnItems = ref<TransactionItemInput[]>([])
const returnPhoto = ref<File | null>(null)

const status = computed(() => detail.value?.transaction.status ?? '')

function transitions() {
  if (!detail.value) return []
  return TRANSACTION_TRANSITIONS[detail.value.transaction.status] ?? []
}

function notify(message: string, title = 'Pemberitahuan') {
  modalMessage.value = message
  modalTitle.value = title
}

function askConfirm(message: string, action: () => Promise<void>) {
  confirmMessage.value = message
  confirmAction = action
}

async function runConfirm() {
  const action = confirmAction
  confirmMessage.value = ''
  confirmAction = null
  if (action) await action()
}

function toItemInputs(items: TransactionItem[]): TransactionItemInput[] {
  return items.map((i) => ({ category_id: i.category_id, quantity: i.quantity, conditions: { ...i.conditions } }))
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [d, cats] = await Promise.all([assetsApi.getTransaction(id), assetsApi.categories()])
    detail.value = d
    categories.value = cats
    const t = d.transaction
    borrowForm.borrower_name = t.borrower_name
    borrowForm.borrower_nik = t.borrower_nik
    borrowForm.borrower_phone = t.borrower_phone
    borrowForm.borrower_address = t.borrower_address ?? ''
    borrowForm.borrow_date = t.borrow_date ?? ''
    borrowForm.return_estimate_date = t.return_estimate_date ?? ''
    borrowItems.value = toItemInputs(d.items)
    returnForm.actual_return_date = t.actual_return_date ?? ''
    returnItems.value = toItemInputs(d.returns)
    borrowPhoto.value = null
    returnPhoto.value = null
    editingBorrow.value = false
    editingReturn.value = false
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat transaksi'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function run(fn: () => Promise<unknown>) {
  saving.value = true
  error.value = null
  try {
    await fn()
    await load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Operasi gagal', 'Gagal')
  } finally {
    saving.value = false
  }
}

function transition(action: string) {
  void run(() => assetsApi.transitionTransaction(id, action))
}

function categoryLabel(item: TransactionItem): string {
  return `${item.category_code} - ${item.category_name}`
}

function validateBorrow(): string | null {
  if (!borrowForm.borrower_name.trim()) return 'Nama Lengkap wajib diisi.'
  if (!/^[0-9]{16}$/.test(borrowForm.borrower_nik.trim())) return 'NIK harus berupa 16 digit angka.'
  if (!borrowForm.borrower_phone.trim()) return 'No HP wajib diisi.'
  if (!borrowForm.borrower_address.trim()) return 'Alamat Domisili wajib diisi.'
  if (!borrowForm.borrow_date || !borrowForm.return_estimate_date) return 'Tanggal pinjam dan kembali wajib diisi.'
  if (borrowForm.return_estimate_date < borrowForm.borrow_date) return 'Tanggal kembali tidak boleh lebih kecil dari tanggal pinjam.'
  if (borrowItems.value.length === 0) return 'Tambahkan minimal satu baris aset.'
  for (const item of borrowItems.value) {
    if (!item.category_id || item.quantity <= 0) return 'Kategori dan jumlah unit setiap baris wajib diisi.'
    if (conditionsTotal(item.conditions) !== item.quantity) return 'Total rincian kondisi harus sama dengan jumlah unit.'
  }
  return null
}

async function saveBorrow() {
  const validation = validateBorrow()
  if (validation) {
    notify(validation)
    return
  }
  await run(async () => {
    let fileId = detail.value?.transaction.borrow_photo_file_id ?? undefined
    if (borrowPhoto.value) {
      const uploaded = await assetsApi.uploadTransactionPhoto(id, borrowPhoto.value)
      fileId = uploaded.file_id
    }
    if (!fileId) throw new Error('Foto Aset yang Dipinjam wajib diunggah.')
    await assetsApi.updateTransaction(id, {
      borrower_name: borrowForm.borrower_name,
      borrower_nik: borrowForm.borrower_nik,
      borrower_phone: borrowForm.borrower_phone,
      borrower_address: borrowForm.borrower_address,
      borrow_date: borrowForm.borrow_date,
      return_estimate_date: borrowForm.return_estimate_date,
      borrow_photo_file_id: fileId,
      items: borrowItems.value,
    })
  })
}

function validateReturn(): string | null {
  if (!returnForm.actual_return_date) return 'Tanggal Kembali wajib diisi.'
  if (returnItems.value.length === 0) return 'Tambahkan minimal satu baris aset yang dikembalikan.'
  for (const item of returnItems.value) {
    if (!item.category_id || item.quantity <= 0) return 'Kategori dan jumlah unit setiap baris wajib diisi.'
    if (conditionsTotal(item.conditions) !== item.quantity) return 'Total rincian kondisi harus sama dengan jumlah unit.'
  }
  if (!returnPhoto.value && !detail.value?.transaction.return_photo_file_id) return 'Foto Aset yang Kembali wajib diunggah.'
  return null
}

async function saveReturn() {
  const validation = validateReturn()
  if (validation) {
    notify(validation)
    return
  }
  await run(async () => {
    let fileId = detail.value?.transaction.return_photo_file_id ?? undefined
    if (returnPhoto.value) {
      const uploaded = await assetsApi.uploadTransactionPhoto(id, returnPhoto.value)
      fileId = uploaded.file_id
    }
    await assetsApi.setReturn(id, {
      actual_return_date: returnForm.actual_return_date,
      return_photo_file_id: fileId,
      items: returnItems.value,
    })
  })
}

function clearReturn() {
  askConfirm('Hapus data pengembalian aset untuk transaksi ini?', () => run(() => assetsApi.clearReturn(id)))
}

function cancelTransaction() {
  const reason = window.prompt('Alasan pembatalan transaksi (wajib):')
  if (!reason || !reason.trim()) {
    notify('Alasan pembatalan wajib diisi.')
    return
  }
  askConfirm('Batalkan transaksi ini? Stok aset akan kembali tersedia.', () => run(() => assetsApi.cancelTransaction(id, reason)))
}

async function download(fileId: string, filename: string) {
  try {
    await downloadFile(`/api/v1/files/${fileId}`, filename)
  } catch {
    notify('Gagal mengunduh berkas', 'Gagal Mengunduh')
  }
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="detail">
      <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <router-link to="/assets/transactions" class="text-sm text-brand-600 hover:underline">← Transaksi Aset</router-link>
          <h1 class="text-xl font-semibold text-slate-900">{{ detail.transaction.transaction_code }}</h1>
          <p class="mt-1 text-sm text-slate-600">Status: <strong>{{ transactionStatusLabel(status) }}</strong></p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in transitions()"
            :key="t.action"
            type="button"
            :disabled="saving || !auth.can('assets:update')"
            class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            @click="transition(t.action)"
          >
            {{ t.label }}
          </button>
          <button
            v-if="status === 'APPROVED'"
            type="button"
            :disabled="saving || !auth.can('assets:update')"
            class="rounded border border-red-300 px-3 py-2 text-sm text-red-600 disabled:opacity-50"
            @click="cancelTransaction"
          >
            Batalkan
          </button>
        </div>
      </header>

      <div class="space-y-6">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="font-semibold text-slate-900">Peminjaman Aset</h2>
            <button
              v-if="canEditTransaction(status) && auth.can('assets:update') && !editingBorrow"
              type="button"
              class="rounded border border-slate-300 px-3 py-1.5 text-sm"
              @click="editingBorrow = true"
            >
              Edit
            </button>
          </div>

          <template v-if="editingBorrow">
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-slate-700" for="e-name">Nama Lengkap</label>
                <input id="e-name" v-model="borrowForm.borrower_name" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700" for="e-nik">NIK</label>
                <input id="e-nik" v-model="borrowForm.borrower_nik" maxlength="16" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700" for="e-phone">No HP</label>
                <input id="e-phone" v-model="borrowForm.borrower_phone" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700" for="e-addr">Alamat Domisili</label>
                <input id="e-addr" v-model="borrowForm.borrower_address" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700" for="e-borrow">Tanggal Pinjam</label>
                <input id="e-borrow" v-model="borrowForm.borrow_date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700" for="e-return">Tanggal Kembali</label>
                <input id="e-return" v-model="borrowForm.return_estimate_date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div class="mt-3">
              <AssetItemRows v-model="borrowItems" :categories="categories" :disabled="saving" />
            </div>
            <div class="mt-3">
              <label class="block text-sm font-medium text-slate-700">Foto Aset yang Dipinjam</label>
              <div class="mt-1">
                <FileDropzone :disabled="saving" :file-name="detail.transaction.borrow_photo_file_id ? 'Foto tersimpan' : null" @update:file="borrowPhoto = $event" />
              </div>
            </div>
            <div class="mt-3 flex gap-2">
              <button type="button" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="saveBorrow">
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
              <button type="button" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editingBorrow = false">Batal</button>
            </div>
          </template>

          <template v-else>
            <dl class="grid gap-1 text-sm sm:grid-cols-2">
              <div class="flex gap-2"><dt class="text-slate-500">Nama:</dt><dd class="text-slate-900">{{ detail.transaction.borrower_name }}</dd></div>
              <div class="flex gap-2"><dt class="text-slate-500">NIK:</dt><dd class="text-slate-900">{{ detail.transaction.borrower_nik }}</dd></div>
              <div class="flex gap-2"><dt class="text-slate-500">No HP:</dt><dd class="text-slate-900">{{ detail.transaction.borrower_phone }}</dd></div>
              <div class="flex gap-2"><dt class="text-slate-500">Alamat:</dt><dd class="text-slate-900">{{ detail.transaction.borrower_address }}</dd></div>
              <div class="flex gap-2"><dt class="text-slate-500">Tanggal Pinjam:</dt><dd class="text-slate-900">{{ detail.transaction.borrow_date }}</dd></div>
              <div class="flex gap-2"><dt class="text-slate-500">Tanggal Kembali:</dt><dd class="text-slate-900">{{ detail.transaction.return_estimate_date }}</dd></div>
            </dl>

            <div class="mt-3 overflow-x-auto">
              <table class="w-full min-w-[32rem] border-collapse text-sm">
                <thead>
                  <tr class="border-b border-slate-200 text-left text-slate-500">
                    <th class="py-2 pr-4">Kategori Aset</th>
                    <th class="py-2 pr-4 text-right">Unit</th>
                    <th class="py-2 pr-4">Kondisi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in detail.items" :key="item.id" class="border-b border-slate-100">
                    <td class="py-2 pr-4 text-slate-900">{{ categoryLabel(item) }}</td>
                    <td class="py-2 pr-4 text-right text-slate-600">{{ item.quantity }}</td>
                    <td class="py-2 pr-4 text-slate-600">{{ conditionSummary(item.conditions) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p v-if="detail.transaction.borrow_photo_file_id" class="mt-3 text-sm">
              <button type="button" class="text-brand-600 hover:underline" @click="download(detail.transaction.borrow_photo_file_id!, `foto-pinjam-${detail.transaction.transaction_code}`)">
                Unduh foto aset dipinjam
              </button>
            </p>
          </template>
        </div>

        <div v-if="returnVisible(status)" class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="font-semibold text-slate-900">Pengembalian Aset</h2>
            <button
              v-if="canEditReturn(status) && auth.can('assets:update') && !editingReturn"
              type="button"
              class="rounded border border-slate-300 px-3 py-1.5 text-sm"
              @click="editingReturn = true"
            >
              Edit
            </button>
          </div>

          <template v-if="editingReturn">
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-slate-700" for="r-date">Tanggal Kembali</label>
                <input id="r-date" v-model="returnForm.actual_return_date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div class="mt-3">
              <AssetItemRows v-model="returnItems" :categories="categories" :disabled="saving" />
            </div>
            <div class="mt-3">
              <label class="block text-sm font-medium text-slate-700">Foto Aset yang Kembali</label>
              <div class="mt-1">
                <FileDropzone :disabled="saving" :file-name="detail.transaction.return_photo_file_id ? 'Foto tersimpan' : null" @update:file="returnPhoto = $event" />
              </div>
            </div>
            <div class="mt-3 flex gap-2">
              <button type="button" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="saveReturn">
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
              <button type="button" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editingReturn = false">Batal</button>
            </div>
          </template>

          <template v-else>
            <dl class="space-y-1 text-sm">
              <div class="flex gap-2"><dt class="text-slate-500">Tanggal Kembali:</dt><dd class="text-slate-900">{{ detail.transaction.actual_return_date || '—' }}</dd></div>
            </dl>
            <div class="mt-3 overflow-x-auto">
              <table class="w-full min-w-[32rem] border-collapse text-sm">
                <thead>
                  <tr class="border-b border-slate-200 text-left text-slate-500">
                    <th class="py-2 pr-4">Kategori Aset</th>
                    <th class="py-2 pr-4 text-right">Unit</th>
                    <th class="py-2 pr-4">Kondisi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in detail.returns" :key="item.id" class="border-b border-slate-100">
                    <td class="py-2 pr-4 text-slate-900">{{ categoryLabel(item) }}</td>
                    <td class="py-2 pr-4 text-right text-slate-600">{{ item.quantity }}</td>
                    <td class="py-2 pr-4 text-slate-600">{{ conditionSummary(item.conditions) }}</td>
                  </tr>
                  <tr v-if="detail.returns.length === 0">
                    <td colspan="3" class="py-3 text-slate-500">Belum ada data pengembalian.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="detail.transaction.return_photo_file_id" class="mt-3 text-sm">
              <button type="button" class="text-brand-600 hover:underline" @click="download(detail.transaction.return_photo_file_id!, `foto-kembali-${detail.transaction.transaction_code}`)">
                Unduh foto aset kembali
              </button>
            </p>
            <div v-if="canEditReturn(status) && auth.can('assets:update') && detail.transaction.actual_return_date" class="mt-3">
              <button type="button" :disabled="saving" class="rounded border border-red-300 px-3 py-2 text-sm text-red-600" @click="clearReturn">Hapus</button>
            </div>
          </template>
        </div>
      </div>
    </template>

    <AppModal :open="modalMessage !== ''" :title="modalTitle" :message="modalMessage" @close="modalMessage = ''" />
    <AppModal
      :open="confirmMessage !== ''"
      variant="confirm"
      title="Konfirmasi"
      :message="confirmMessage"
      @close="confirmMessage = ''"
      @confirm="runConfirm"
    />
  </section>
</template>
