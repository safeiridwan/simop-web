<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import AppModal from '@/components/AppModal.vue'
import ImportPanel from '@/components/ImportPanel.vue'
import Pagination from '@/components/Pagination.vue'
import { useClientPage } from '@/composables/useClientPage'
import { useAuthStore } from '@/app/stores/auth'
import { financeApi } from '../api'
import { ACCOUNT_TYPES, accountTypeLabel, type Account, type ImportResult } from '../types'

const auth = useAuthStore()
const canUpdate = auth.can('finance:update')

const accounts = ref<Account[]>([])
const { paged: pagedAccounts, meta: accountsMeta, setPage: setAccountsPage, setPageSize: setAccountsPageSize, reset: resetAccountsPage } = useClientPage(accounts)
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ code: '', name: '', account_type: 'ASSET', description: '' })

const showImport = ref(false)
const importing = ref(false)
const importResult = ref<ImportResult | null>(null)
const importError = ref<string | null>(null)

const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')
const confirmMessage = ref('')
let confirmAction: (() => Promise<void>) | null = null

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

async function load() {
  loading.value = true
  error.value = null
  try {
    accounts.value = await financeApi.listAccounts()
    resetAccountsPage()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat akun'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function resetForm() {
  form.code = ''
  form.name = ''
  form.account_type = 'ASSET'
  form.description = ''
  editingId.value = null
}

function editAccount(a: Account) {
  editingId.value = a.id
  form.code = a.code
  form.name = a.name
  form.account_type = a.account_type
  form.description = a.description ?? ''
  showForm.value = true
}

async function submit() {
  submitting.value = true
  error.value = null
  try {
    if (editingId.value) {
      await financeApi.updateAccount(editingId.value, {
        code: form.code,
        name: form.name,
        account_type: form.account_type,
        description: form.description || undefined,
      })
    } else {
      await financeApi.createAccount({
        code: form.code,
        name: form.name,
        account_type: form.account_type,
        description: form.description || undefined,
      })
    }
    showForm.value = false
    resetForm()
    await load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal menyimpan akun', 'Gagal')
  } finally {
    submitting.value = false
  }
}

function removeAccount(a: Account) {
  askConfirm(`Hapus akun ${a.code} - ${a.name}?`, async () => {
    try {
      await financeApi.deleteAccount(a.id)
      await load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal menghapus akun', 'Gagal')
    }
  })
}

async function onImport(file: File) {
  importing.value = true
  importResult.value = null
  importError.value = null
  try {
    importResult.value = await financeApi.importAccounts(file)
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
        <h1 class="text-xl font-semibold text-slate-900">Bagan Akun</h1>
        <p class="text-sm text-slate-500">{{ accounts.length }} akun</p>
      </div>
      <div v-if="canUpdate" class="flex gap-2">
        <button type="button" class="rounded border border-brand-500 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 sm:w-fit" @click="showImport = !showImport">
          {{ showImport ? 'Tutup Impor' : 'Impor' }}
        </button>
        <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="editingId ? resetForm() : (showForm = !showForm)">
          {{ showForm ? 'Batal' : 'Tambah Akun' }}
        </button>
      </div>
    </header>

    <ImportPanel
      v-if="showImport"
      template-path="/api/v1/finance/accounts/import/template"
      template-filename="template-akun"
      :busy="importing"
      :result="importResult"
      :error="importError"
      @import="onImport"
    />

    <form v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4" @submit.prevent="submit">
      <input v-model="form.code" placeholder="Kode" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.name" placeholder="Nama akun" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <select v-model="form.account_type" class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option v-for="t in ACCOUNT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
      <input v-model="form.description" placeholder="Keterangan" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <button type="submit" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-4 sm:w-fit">
        {{ submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan' }}
      </button>
    </form>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="accounts.length === 0" class="text-sm text-slate-500">Belum ada akun.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Kode</th>
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2 pr-4">Tipe</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in pagedAccounts" :key="a.id" class="border-b border-slate-100">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ a.code }}</td>
            <td class="py-2 pr-4 text-slate-900">{{ a.name }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ accountTypeLabel(a.account_type) }}</td>
            <td class="py-2 text-right">
              <button v-if="canUpdate" type="button" class="mr-2 text-xs text-brand-600 hover:underline" @click="editAccount(a)">Edit</button>
              <button v-if="canUpdate" type="button" class="text-xs text-red-600 hover:underline" @click="removeAccount(a)">Hapus</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="accountsMeta" @change="setAccountsPage" @page-size-change="setAccountsPageSize" />

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
