<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import AppModal from '@/components/AppModal.vue'
import ImportPanel from '@/components/ImportPanel.vue'
import { useAuthStore } from '@/app/stores/auth'
import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { financeApi } from '../api'
import type { Budget, ImportResult, PaguSummary } from '../types'

const auth = useAuthStore()
const canUpdate = auth.can('finance:update')

const rows = ref<PaguSummary[]>([])
const budgets = ref<Budget[]>([])
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const showForm = ref(false)
const editingBudgetId = ref<string | null>(null)
const fiscalYear = ref(new Date().getFullYear())
const form = reactive({ organization_unit_id: '', fiscal_year: new Date().getFullYear(), budget_amount: '' })

const showImport = ref(false)
const importing = ref(false)
const importResult = ref<ImportResult | null>(null)
const importError = ref<string | null>(null)

const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')
const confirmMessage = ref('')
let confirmAction: (() => Promise<void>) | null = null

function money(v: number): string {
  return v.toLocaleString('id-ID')
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

function budgetForUnit(unitId: string): Budget | null {
  return budgets.value.find((b) => b.organization_unit_id === unitId && b.fiscal_year === fiscalYear.value) ?? null
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [summary, unitList, budgetList] = await Promise.all([
      financeApi.listPagu(fiscalYear.value),
      organizationApi.listUnits({ pageSize: 200 }),
      financeApi.listBudgets({ fiscalYear: fiscalYear.value, pageSize: 200 }),
    ])
    rows.value = summary
    units.value = unitList.data
    budgets.value = budgetList.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat anggaran'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function resetForm() {
  form.organization_unit_id = ''
  form.fiscal_year = fiscalYear.value
  form.budget_amount = ''
  editingBudgetId.value = null
}

function editBudget(unitId: string) {
  const budget = budgetForUnit(unitId)
  if (!budget) return
  editingBudgetId.value = budget.id
  form.organization_unit_id = budget.organization_unit_id
  form.fiscal_year = budget.fiscal_year
  form.budget_amount = String(budget.budget_amount)
  showForm.value = true
}

async function submit() {
  saving.value = true
  error.value = null
  try {
    if (editingBudgetId.value) {
      await financeApi.updateBudget(editingBudgetId.value, Number(form.budget_amount))
    } else {
      const budget = await financeApi.createBudget({
        organization_unit_id: form.organization_unit_id,
        fiscal_year: Number(form.fiscal_year),
        budget_amount: Number(form.budget_amount),
      })
      // A budget only counts once approved, so approving keeps the unit anggaran
      // immediately visible in the summary.
      await financeApi.transitionBudget(budget.id, 'submit')
      await financeApi.transitionBudget(budget.id, 'approve')
    }
    showForm.value = false
    fiscalYear.value = Number(form.fiscal_year)
    resetForm()
    await load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal menyimpan anggaran', 'Gagal')
  } finally {
    saving.value = false
  }
}

function removeBudget(unitId: string) {
  const budget = budgetForUnit(unitId)
  if (!budget) return
  askConfirm('Hapus anggaran unit ini?', async () => {
    try {
      await financeApi.deleteBudget(budget.id)
      await load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal menghapus anggaran', 'Gagal')
    }
  })
}

async function onImport(file: File) {
  importing.value = true
  importResult.value = null
  importError.value = null
  try {
    importResult.value = await financeApi.importBudgets(file)
    if (importResult.value.created > 0) await load()
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Gagal mengimpor'
  } finally {
    importing.value = false
  }
}

function exportCsv() {
  const header = ['Unit', 'Anggaran', 'Komitmen', 'Realisasi', 'Sisa']
  const lines = rows.value.map((r) => [r.organization_unit_name, r.pagu, r.committed, r.realized, r.remaining])
  const csv = [header, ...lines].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `anggaran-${fiscalYear.value}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Anggaran</h1>
        <p class="text-sm text-slate-500">Anggaran, komitmen program, realisasi, dan sisa per unit.</p>
      </div>
      <div v-if="canUpdate" class="flex gap-2">
        <button type="button" class="rounded border border-brand-500 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 sm:w-fit" @click="showImport = !showImport">
          {{ showImport ? 'Tutup Impor' : 'Impor' }}
        </button>
        <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="editingBudgetId ? resetForm() : (showForm = !showForm)">
          {{ showForm ? 'Batal' : 'Tambah Anggaran' }}
        </button>
      </div>
    </header>

    <ImportPanel
      v-if="showImport"
      template-path="/api/v1/finance/budgets/import/template"
      template-filename="template-anggaran"
      :busy="importing"
      :result="importResult"
      :error="importError"
      @import="onImport"
    />

    <form v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3" @submit.prevent="submit">
      <select v-model="form.organization_unit_id" :disabled="!!editingBudgetId" required class="rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100">
        <option value="" disabled>Unit organisasi</option>
        <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
      <input v-model="form.fiscal_year" type="number" :disabled="!!editingBudgetId" placeholder="Tahun" required class="rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" />
      <input v-model="form.budget_amount" type="number" step="0.01" placeholder="Jumlah anggaran" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-3 sm:w-fit">
        {{ saving ? 'Menyimpan...' : editingBudgetId ? 'Simpan Perubahan' : 'Simpan' }}
      </button>
    </form>

    <div class="mb-4 flex flex-wrap items-end gap-2">
      <label class="flex flex-col text-sm text-slate-600">
        Tahun
        <input v-model.number="fiscalYear" type="number" class="mt-1 rounded border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="load">Terapkan</button>
      <button type="button" :disabled="rows.length === 0" class="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50" @click="exportCsv">
        Ekspor CSV
      </button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="rows.length === 0" class="text-sm text-slate-500">Belum ada anggaran untuk tahun {{ fiscalYear }}.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Unit</th>
            <th class="py-2 pr-4 text-right">Anggaran</th>
            <th class="py-2 pr-4 text-right">Komitmen</th>
            <th class="py-2 pr-4 text-right">Realisasi</th>
            <th class="py-2 pr-4 text-right">Sisa</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.organization_unit_id" class="border-b border-slate-100">
            <td class="py-2 pr-4 text-slate-900">{{ r.organization_unit_name }}</td>
            <td class="py-2 pr-4 text-right text-slate-600">{{ money(r.pagu) }}</td>
            <td class="py-2 pr-4 text-right text-slate-600">{{ money(r.committed) }}</td>
            <td class="py-2 pr-4 text-right text-slate-600">{{ money(r.realized) }}</td>
            <td class="py-2 pr-4 text-right font-medium" :class="r.remaining < 0 ? 'text-red-600' : 'text-slate-900'">{{ money(r.remaining) }}</td>
            <td class="py-2 text-right">
              <template v-if="canUpdate && budgetForUnit(r.organization_unit_id)">
                <button type="button" class="mr-2 text-xs text-brand-600 hover:underline" @click="editBudget(r.organization_unit_id)">Edit</button>
                <button type="button" class="text-xs text-red-600 hover:underline" @click="removeBudget(r.organization_unit_id)">Hapus</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
