<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import Pagination from '@/components/Pagination.vue'
import { useAuthStore } from '@/app/stores/auth'
import { financeApi } from '../api'
import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { BUDGET_TRANSITIONS, type Account, type Budget, type PageMeta } from '../types'

const auth = useAuthStore()
const budgets = ref<Budget[]>([])
const meta = ref<PageMeta | null>(null)
const accounts = ref<Account[]>([])
const units = ref<Unit[]>([])
const accountNames = ref<Record<string, string>>({})
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const showForm = ref(false)
const page = ref(1)
const form = reactive({ organization_unit_id: '', account_id: '', fiscal_year: new Date().getFullYear(), budget_amount: '' })

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, accountList, unitList] = await Promise.all([
      financeApi.listBudgets({ page: page.value }),
      financeApi.listAccounts(),
      organizationApi.listUnits({ pageSize: 200 }),
    ])
    budgets.value = list.data
    meta.value = list.meta ?? null
    accounts.value = accountList
    units.value = unitList.data
    accountNames.value = Object.fromEntries(accountList.map((a) => [a.id, `${a.code} ${a.name}`]))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat anggaran'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onPageChange(target: number) {
  page.value = target
  void load()
}

async function run(fn: () => Promise<unknown>) {
  saving.value = true
  error.value = null
  try {
    await fn()
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Operasi gagal'
  } finally {
    saving.value = false
  }
}

function submit() {
  void run(async () => {
    await financeApi.createBudget({
      organization_unit_id: form.organization_unit_id,
      account_id: form.account_id,
      fiscal_year: Number(form.fiscal_year),
      budget_amount: Number(form.budget_amount),
    })
    showForm.value = false
    form.organization_unit_id = ''
    form.account_id = ''
    form.budget_amount = ''
  })
}

function transitions(status: string) {
  return BUDGET_TRANSITIONS[status] ?? []
}

function transitionBudget(id: string, action: string) {
  void run(() => financeApi.transitionBudget(id, action))
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Anggaran</h1>
        <p class="text-sm text-slate-500">{{ meta?.total ?? budgets.length }} baris</p>
      </div>
      <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
        {{ showForm ? 'Batal' : 'Tambah Anggaran' }}
      </button>
    </header>

    <form v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="submit">
      <select v-model="form.organization_unit_id" required class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="" disabled>Unit organisasi</option>
        <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
      <select v-model="form.account_id" required class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="" disabled>Akun</option>
        <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.code }} {{ a.name }}</option>
      </select>
      <input v-model="form.fiscal_year" type="number" placeholder="Tahun" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.budget_amount" type="number" step="0.01" placeholder="Jumlah" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">
        Simpan
      </button>
    </form>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="budgets.length === 0" class="text-sm text-slate-500">Belum ada anggaran.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Akun</th>
            <th class="py-2 pr-4">Tahun</th>
            <th class="py-2 pr-4">Jumlah</th>
            <th class="py-2 pr-4">Status</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in budgets" :key="b.id" class="border-b border-slate-100">
            <td class="py-2 pr-4 text-slate-900">{{ accountNames[b.account_id] ?? b.account_id }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ b.fiscal_year }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ b.budget_amount.toLocaleString('id-ID') }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ b.status }}</td>
            <td class="py-2">
              <button
                v-for="t in transitions(b.status)"
                :key="t.action"
                type="button"
                :disabled="saving || !auth.can('finance:approve')"
                class="mr-2 text-xs text-brand-600 hover:underline disabled:opacity-50"
                @click="transitionBudget(b.id, t.action)"
              >
                {{ t.label }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" />
  </section>
</template>
