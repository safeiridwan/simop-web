<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { useAuthStore } from '@/app/stores/auth'
import { financeApi } from '../api'
import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { JOURNAL_TRANSITIONS, type Account, type Journal } from '../types'

const auth = useAuthStore()
const journals = ref<Journal[]>([])
const accounts = ref<Account[]>([])
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const showForm = ref(false)

const form = reactive({
  transaction_date: new Date().toISOString().slice(0, 10),
  organization_unit_id: '',
  description: '',
  lines: [
    { account_id: '', debit: 0, credit: 0 },
    { account_id: '', debit: 0, credit: 0 },
  ],
})

const totalDebit = computed(() => form.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0))
const totalCredit = computed(() => form.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0))
const balanced = computed(() => totalDebit.value === totalCredit.value && totalDebit.value > 0)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, accountList, unitList] = await Promise.all([
      financeApi.listJournals(),
      financeApi.listAccounts(),
      organizationApi.listUnits({ pageSize: 200 }),
    ])
    journals.value = list.data
    accounts.value = accountList
    units.value = unitList.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat jurnal'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function addLine() {
  form.lines.push({ account_id: '', debit: 0, credit: 0 })
}

function removeLine(index: number) {
  form.lines.splice(index, 1)
}

async function submit() {
  saving.value = true
  error.value = null
  try {
    await financeApi.createJournal({
      transaction_date: form.transaction_date,
      organization_unit_id: form.organization_unit_id,
      description: form.description || undefined,
      lines: form.lines.map((l) => ({ account_id: l.account_id, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
    })
    showForm.value = false
    form.description = ''
    form.lines = [
      { account_id: '', debit: 0, credit: 0 },
      { account_id: '', debit: 0, credit: 0 },
    ]
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan jurnal'
  } finally {
    saving.value = false
  }
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

function transitions(status: string) {
  return JOURNAL_TRANSITIONS[status] ?? []
}

function transitionJournal(id: string, action: string) {
  void run(() => financeApi.transitionJournal(id, action))
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Jurnal</h1>
        <p class="text-sm text-slate-500">{{ journals.length }} jurnal</p>
      </div>
      <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
        {{ showForm ? 'Batal' : 'Tambah Jurnal' }}
      </button>
    </header>

    <div v-if="showForm" class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <div class="grid gap-3 sm:grid-cols-3">
        <input v-model="form.transaction_date" type="date" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <select v-model="form.organization_unit_id" required class="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Unit organisasi</option>
          <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
        <input v-model="form.description" placeholder="Deskripsi" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div class="mt-4 space-y-2">
        <div v-for="(line, index) in form.lines" :key="index" class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_8rem_8rem_auto]">
          <select v-model="line.account_id" required class="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="" disabled>Akun</option>
            <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.code }} {{ a.name }}</option>
          </select>
          <input v-model.number="line.debit" type="number" step="0.01" min="0" placeholder="Debit" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input v-model.number="line.credit" type="number" step="0.01" min="0" placeholder="Kredit" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm text-red-600" :disabled="form.lines.length <= 2" @click="removeLine(index)">Hapus</button>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <span class="text-slate-600">Debit: <strong>{{ totalDebit.toLocaleString('id-ID') }}</strong></span>
        <span class="text-slate-600">Kredit: <strong>{{ totalCredit.toLocaleString('id-ID') }}</strong></span>
        <span :class="balanced ? 'text-green-700' : 'text-amber-600'">{{ balanced ? 'Seimbang' : 'Belum seimbang' }}</span>
        <button type="button" class="rounded border border-slate-300 px-3 py-1.5 text-sm" @click="addLine">Tambah Baris</button>
        <button type="button" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="submit">Simpan</button>
      </div>
      <p class="mt-2 text-xs text-slate-400">Jurnal hanya dapat diposting bila debit = kredit dan minimal dua baris.</p>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="journals.length === 0" class="text-sm text-slate-500">Belum ada jurnal.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Nomor</th>
            <th class="py-2 pr-4">Tanggal</th>
            <th class="py-2 pr-4">Deskripsi</th>
            <th class="py-2 pr-4">Status</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="j in journals" :key="j.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">
              <router-link :to="`/finance/journals/${j.id}`" class="text-brand-600 hover:underline">{{ j.journal_number }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ j.transaction_date || '—' }}</td>
            <td class="py-2 pr-4 text-slate-900">{{ j.description || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ j.status }}</td>
            <td class="py-2">
              <button
                v-for="t in transitions(j.status)"
                :key="t.action"
                type="button"
                :disabled="saving || !auth.can(t.permission)"
                class="mr-2 text-xs text-brand-600 hover:underline disabled:opacity-50"
                @click="transitionJournal(j.id, t.action)"
              >
                {{ t.label }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
