<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import PersonPicker from '@/components/PersonPicker.vue'
import { useAuthStore } from '@/app/stores/auth'
import type { Person } from '@/modules/people/types'
import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { financeApi } from '../api'
import { REIMBURSEMENT_TRANSITIONS, type Receipt, type Reimbursement } from '../types'

const auth = useAuthStore()
const reimbursements = ref<Reimbursement[]>([])
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const showForm = ref(false)
const openRow = ref<string | null>(null)
const receipts = ref<Receipt[]>([])
const receiptForm = reactive({ receipt_number: '', receipt_date: '' })

const selectedPerson = ref<Person | null>(null)
const form = reactive({ organization_unit_id: '', amount: '', reason: '' })

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, unitList] = await Promise.all([financeApi.listReimbursements(), organizationApi.listUnits({ pageSize: 200 })])
    reimbursements.value = list.data
    units.value = unitList.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat reimbursement'
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
    error.value = err instanceof Error ? err.message : 'Operasi gagal'
  } finally {
    saving.value = false
  }
}

function submit() {
  if (!selectedPerson.value) {
    error.value = 'Pilih pemohon terlebih dahulu.'
    return
  }
  void run(async () => {
    await financeApi.createReimbursement({
      organization_unit_id: form.organization_unit_id,
      requester_id: selectedPerson.value!.id,
      amount: Number(form.amount),
      reason: form.reason || undefined,
    })
    showForm.value = false
    selectedPerson.value = null
    form.amount = ''
    form.reason = ''
  })
}

async function toggle(row: Reimbursement) {
  if (openRow.value === row.id) {
    openRow.value = null
    return
  }
  openRow.value = row.id
  receipts.value = await financeApi.listReceipts(row.id)
  receiptForm.receipt_number = ''
  receiptForm.receipt_date = ''
}

function addReceipt(reimbursementId: string) {
  void run(async () => {
    await financeApi.createReceipt({
      reimbursement_id: reimbursementId,
      receipt_number: receiptForm.receipt_number,
      receipt_date: receiptForm.receipt_date || undefined,
    })
    receipts.value = await financeApi.listReceipts(reimbursementId)
    receiptForm.receipt_number = ''
    receiptForm.receipt_date = ''
  })
}

function verifyReceipt(receiptId: string, reimbursementId: string) {
  void run(async () => {
    await financeApi.verifyReceipt(receiptId)
    receipts.value = await financeApi.listReceipts(reimbursementId)
  })
}

function transitions(status: string) {
  return REIMBURSEMENT_TRANSITIONS[status] ?? []
}

function transitionReimbursement(id: string, action: string) {
  void run(() => financeApi.transitionReimbursement(id, action))
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Reimbursement (SPJ)</h1>
        <p class="text-sm text-slate-500">{{ reimbursements.length }} pengajuan</p>
      </div>
      <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
        {{ showForm ? 'Batal' : 'Ajukan Reimbursement' }}
      </button>
    </header>

    <div v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700">Pemohon</label>
        <PersonPicker v-model="selectedPerson" />
      </div>
      <select v-model="form.organization_unit_id" required class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="" disabled>Unit organisasi</option>
        <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
      <input v-model="form.amount" type="number" step="0.01" placeholder="Jumlah" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.reason" placeholder="Keperluan" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
      <button type="button" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit" @click="submit">
        Simpan
      </button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="reimbursements.length === 0" class="text-sm text-slate-500">Belum ada pengajuan.</p>

    <div v-else class="space-y-2">
      <div v-for="r in reimbursements" :key="r.id" class="rounded-lg border border-slate-200 bg-white">
        <div class="flex w-full flex-wrap items-center justify-between gap-2 p-3">
          <button type="button" class="min-w-0 flex-1 text-left" @click="toggle(r)">
            <span class="block text-sm font-medium text-slate-900">{{ r.amount.toLocaleString('id-ID') }}</span>
            <span class="text-xs text-slate-500">{{ r.reason || '—' }} · {{ r.status }}</span>
          </button>
          <span class="flex flex-wrap gap-2">
            <button
              v-for="t in transitions(r.status)"
              :key="t.action"
              type="button"
              :disabled="saving || !auth.can(t.permission)"
              class="rounded border border-slate-300 px-2 py-1 text-xs text-brand-600 disabled:opacity-50"
              @click="transitionReimbursement(r.id, t.action)"
            >
              {{ t.label }}
            </button>
          </span>
        </div>

        <div v-if="openRow === r.id" class="border-t border-slate-100 p-3">
          <h3 class="mb-2 text-xs font-semibold uppercase text-slate-500">Bukti</h3>
          <ul class="mb-2 space-y-1 text-sm">
            <li v-for="rc in receipts" :key="rc.id" class="flex items-center justify-between gap-2">
              <span class="text-slate-700">{{ rc.receipt_number }} <span class="text-xs text-slate-400">{{ rc.receipt_date || '' }}</span></span>
              <span v-if="rc.verified_at" class="text-xs text-green-700">Terverifikasi</span>
              <button v-else type="button" class="text-xs text-brand-600 hover:underline" :disabled="saving" @click="verifyReceipt(rc.id, r.id)">Verifikasi</button>
            </li>
            <li v-if="receipts.length === 0" class="text-slate-500">Belum ada bukti.</li>
          </ul>
          <form class="grid gap-2 sm:grid-cols-[1fr_auto_auto]" @submit.prevent="addReceipt(r.id)">
            <input v-model="receiptForm.receipt_number" placeholder="Nomor bukti" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="receiptForm.receipt_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Tambah Bukti</button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
