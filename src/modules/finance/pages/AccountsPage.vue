<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { financeApi } from '../api'
import { ACCOUNT_TYPES, accountTypeLabel, type Account } from '../types'

const accounts = ref<Account[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const form = reactive({ code: '', name: '', account_type: 'ASSET' })

async function load() {
  loading.value = true
  error.value = null
  try {
    accounts.value = await financeApi.listAccounts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat akun'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function submit() {
  submitting.value = true
  error.value = null
  try {
    await financeApi.createAccount({ ...form })
    showForm.value = false
    form.code = ''
    form.name = ''
    form.account_type = 'ASSET'
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan akun'
  } finally {
    submitting.value = false
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
      <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
        {{ showForm ? 'Batal' : 'Tambah Akun' }}
      </button>
    </header>

    <form v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3" @submit.prevent="submit">
      <input v-model="form.code" placeholder="Kode" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.name" placeholder="Nama akun" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <select v-model="form.account_type" class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option v-for="t in ACCOUNT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
      <button type="submit" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-3 sm:w-fit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="accounts.length === 0" class="text-sm text-slate-500">Belum ada akun.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Kode</th>
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2">Tipe</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in accounts" :key="a.id" class="border-b border-slate-100">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ a.code }}</td>
            <td class="py-2 pr-4 text-slate-900">{{ a.name }}</td>
            <td class="py-2 text-slate-600">{{ accountTypeLabel(a.account_type) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
