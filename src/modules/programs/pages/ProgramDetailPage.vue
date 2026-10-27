<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AppModal from '@/components/AppModal.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'
import FileDropzone from '@/components/FileDropzone.vue'
import { useAuthStore } from '@/app/stores/auth'
import { downloadFile } from '@/services/http'
import { formatDateRange } from '@/utils/date'
import { formatRupiah } from '@/utils/currency'
import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { programsApi } from '../api'
import {
  canEditHeader,
  canEditLpj,
  canEditProposal,
  lpjVisible,
  PROGRAM_REVERTS,
  PROGRAM_TRANSITIONS,
  PROGRAM_TYPES,
  programStatusLabel,
  programTypeLabel,
  type ProgramDetail,
} from '../types'

const route = useRoute()
const auth = useAuthStore()
const id = route.params.id as string

const detail = ref<ProgramDetail | null>(null)
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const status = computed(() => detail.value?.program.status ?? '')

const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')
const confirmMessage = ref('')
let confirmAction: (() => Promise<void>) | null = null

// Header state.
const editingHeader = ref(false)
const headerForm = reactive({
  organization_unit_id: '',
  name: '',
  objective: '',
  program_type: '',
  start_date: '',
  end_date: '',
  planned_amount: null as number | null,
})

// Proposal section state.
const proposalAmount = ref<number | null>(null)
const proposalFile = ref<File | null>(null)
const editingProposal = ref(false)
// LPJ section state.
const lpjAmount = ref<number | null>(null)
const lpjFile = ref<File | null>(null)
const editingLpj = ref(false)

const proposalSaved = computed(() => !!detail.value?.program.proposal_file_id && detail.value?.program.requested_amount != null)
const lpjSaved = computed(() => !!detail.value?.program.lpj_file_id && detail.value?.program.actual_amount != null)

const showLpj = computed(() => lpjVisible(status.value) || !!detail.value?.program.lpj_file_id)
const showProposalInput = computed(() => !proposalSaved.value || editingProposal.value)
const showLpjInput = computed(() => !lpjSaved.value || editingLpj.value)
const canEdit = computed(() => canEditHeader(status.value, auth.isSuperAdmin))

function transitions() {
  if (!detail.value) return []
  return PROGRAM_TRANSITIONS[detail.value.program.status] ?? []
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

async function load() {
  loading.value = true
  error.value = null
  try {
    const [d, unitList] = await Promise.all([programsApi.get(id), organizationApi.listUnits({ pageSize: 200 })])
    detail.value = d
    units.value = unitList.data
    fillHeader()
    proposalAmount.value = d.program.requested_amount
    lpjAmount.value = d.program.actual_amount
    proposalFile.value = null
    lpjFile.value = null
    editingProposal.value = !proposalSaved.value
    editingLpj.value = !lpjSaved.value
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat program'
  } finally {
    loading.value = false
  }
}

// API dates may be full timestamps; date inputs expect YYYY-MM-DD.
function asDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : ''
}

function fillHeader() {
  const p = detail.value?.program
  if (!p) return
  headerForm.organization_unit_id = p.organization_unit_id
  headerForm.name = p.name
  headerForm.objective = p.objective ?? ''
  headerForm.program_type = p.program_type ?? ''
  headerForm.start_date = asDateInput(p.start_date)
  headerForm.end_date = asDateInput(p.end_date)
  headerForm.planned_amount = p.planned_amount
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
  void run(() => programsApi.transition(id, action))
}

function revertProgram() {
  askConfirm('Mundurkan status program ini ke status sebelumnya?', () => run(() => programsApi.revert(id, '')))
}

function validateHeaderForm(): string | null {
  const missing: string[] = []
  if (!headerForm.name.trim()) missing.push('Nama')
  if (!headerForm.organization_unit_id) missing.push('Unit Organisasi')
  if (!headerForm.objective.trim()) missing.push('Tujuan')
  if (!headerForm.program_type) missing.push('Tipe Program')
  if (!headerForm.start_date || !headerForm.end_date) missing.push('Tanggal Pelaksanaan')
  if (headerForm.planned_amount == null) missing.push('Rencana Anggaran')
  if (missing.length > 0) {
    return `Field berikut wajib diisi: ${[...new Set(missing)].join(', ')}.`
  }
  if (headerForm.start_date > headerForm.end_date) {
    return 'Tanggal mulai tidak boleh lebih besar dari tanggal selesai.'
  }
  if (!(headerForm.planned_amount! > 0)) {
    return 'Rencana Anggaran wajib diisi dan harus lebih dari 0.'
  }
  return null
}

function saveHeader() {
  const validation = validateHeaderForm()
  if (validation) {
    notify(validation, 'Data Belum Lengkap')
    return
  }
  void run(async () => {
    await programsApi.updateHeader(id, {
      organization_unit_id: headerForm.organization_unit_id,
      name: headerForm.name,
      objective: headerForm.objective,
      program_type: headerForm.program_type,
      start_date: headerForm.start_date,
      end_date: headerForm.end_date,
      planned_amount: headerForm.planned_amount!,
    })
    editingHeader.value = false
  })
}

function cancelHeader() {
  fillHeader()
  editingHeader.value = false
}

async function saveProposal() {
  if (!detail.value) return
  const file = proposalFile.value
  const existing = detail.value.program.proposal_file_id
  if (!file && !existing) {
    notify('Lengkapi berkas Proposal terlebih dahulu sebelum menyimpan.', 'Data Belum Lengkap')
    return
  }
  const nominal = proposalAmount.value
  if (nominal == null || Number.isNaN(nominal) || nominal <= 0) {
    notify('Total Komitmen Anggaran Diajukan wajib diisi dan harus lebih dari 0.', 'Data Belum Lengkap')
    return
  }
  await run(async () => {
    let fileId = existing
    if (file) {
      const uploaded = await programsApi.uploadFile(id, file)
      fileId = uploaded.file_id
    }
    await programsApi.setProposal(id, { proposal_file_id: fileId, requested_amount: nominal })
  })
}

function removeProposal() {
  askConfirm('Hapus berkas Proposal dan nominal komitmen untuk program ini?', () =>
    run(() => programsApi.setProposal(id, { proposal_file_id: null, requested_amount: null })),
  )
}

async function saveLpj() {
  if (!detail.value) return
  const file = lpjFile.value
  const existing = detail.value.program.lpj_file_id
  if (!file && !existing) {
    notify('Lengkapi berkas LPJ terlebih dahulu sebelum menyimpan.', 'Data Belum Lengkap')
    return
  }
  const nominal = lpjAmount.value
  if (nominal == null || Number.isNaN(nominal) || nominal <= 0) {
    notify('Total Realisasi Anggaran wajib diisi dan harus lebih dari 0.', 'Data Belum Lengkap')
    return
  }
  await run(async () => {
    let fileId = existing
    if (file) {
      const uploaded = await programsApi.uploadFile(id, file)
      fileId = uploaded.file_id
    }
    await programsApi.setLpj(id, { lpj_file_id: fileId, actual_amount: nominal })
  })
}

function removeLpj() {
  askConfirm('Hapus berkas LPJ dan nominal realisasi untuk program ini?', () =>
    run(() => programsApi.setLpj(id, { lpj_file_id: null, actual_amount: null })),
  )
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
          <AppBreadcrumb :items="[{ label: 'Semua Program', to: '/programs' }, { label: 'Detail Program' }]" />
          <p class="mt-1 text-sm text-slate-600">Status: <strong>{{ programStatusLabel(detail.program.status) }}</strong></p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in transitions()"
            :key="t.action"
            type="button"
            :disabled="saving || !auth.can(t.permission)"
            class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            @click="transition(t.action)"
          >
            {{ t.label }}
          </button>
          <button
            v-if="detail.program.status !== 'COMPLETED' && detail.program.status !== 'CANCELLED'"
            type="button"
            :disabled="saving"
            class="rounded border border-red-300 px-3 py-2 text-sm text-red-600 disabled:opacity-50"
            @click="transition('cancel')"
          >
            Batalkan
          </button>
          <button
            v-if="PROGRAM_REVERTS[detail.program.status]"
            type="button"
            :disabled="saving || !auth.can('programs:update')"
            class="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
            @click="revertProgram"
          >
            {{ PROGRAM_REVERTS[detail.program.status] }}
          </button>
        </div>
      </header>

      <div class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="font-semibold text-slate-900">Header</h2>
          <div v-if="canEdit" class="flex gap-2">
            <button v-if="!editingHeader" type="button" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editingHeader = true">
              Edit
            </button>
          </div>
        </div>

        <form v-if="editingHeader" class="grid gap-3 sm:grid-cols-2" @submit.prevent="saveHeader">
          <div>
            <label class="block text-sm font-medium text-slate-700" for="h-code">Kode</label>
            <input id="h-code" :value="detail.program.program_code" readonly class="mt-1 w-full rounded border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-xs text-slate-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="h-name">Nama</label>
            <input id="h-name" v-model="headerForm.name" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="h-unit">Unit Organisasi</label>
            <select id="h-unit" v-model="headerForm.organization_unit_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="" disabled>Pilih unit</option>
              <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }} ({{ u.code }})</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="h-type">Tipe Program</label>
            <select id="h-type" v-model="headerForm.program_type" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="" disabled>Pilih tipe</option>
              <option v-for="t in PROGRAM_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-700" for="h-obj">Tujuan</label>
            <input id="h-obj" v-model="headerForm.objective" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Tanggal Pelaksanaan</label>
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <input v-model="headerForm.start_date" type="date" required class="rounded border border-slate-300 px-3 py-2 text-sm" aria-label="Tanggal mulai pelaksanaan" />
              <span class="text-sm text-slate-500">s/d</span>
              <input v-model="headerForm.end_date" type="date" required class="rounded border border-slate-300 px-3 py-2 text-sm" aria-label="Tanggal selesai pelaksanaan" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="h-planned">Rencana Anggaran</label>
            <CurrencyInput id="h-planned" v-model="headerForm.planned_amount" class="mt-1" />
          </div>
          <div class="flex gap-2 sm:col-span-2">
            <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
            <button type="button" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="cancelHeader">Batal</button>
          </div>
        </form>

        <dl v-else class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt class="text-slate-500">Kode</dt><dd class="font-mono text-xs text-slate-900">{{ detail.program.program_code }}</dd></div>
          <div><dt class="text-slate-500">Nama</dt><dd class="text-slate-900">{{ detail.program.name }}</dd></div>
          <div><dt class="text-slate-500">Unit</dt><dd class="text-slate-900">{{ detail.program.organization_unit_name }}</dd></div>
          <div><dt class="text-slate-500">Tipe Program</dt><dd class="text-slate-900">{{ programTypeLabel(detail.program.program_type) }}</dd></div>
          <div><dt class="text-slate-500">Tanggal Pelaksanaan</dt><dd class="text-slate-900">{{ formatDateRange(detail.program.start_date, detail.program.end_date) }}</dd></div>
          <div><dt class="text-slate-500">Rencana Anggaran</dt><dd class="text-slate-900">{{ formatRupiah(detail.program.planned_amount) }}</dd></div>
          <div class="sm:col-span-2 lg:col-span-3"><dt class="text-slate-500">Tujuan</dt><dd class="text-slate-900">{{ detail.program.objective || '-' }}</dd></div>
        </dl>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Proposal</h2>

          <template v-if="showProposalInput">
            <FileDropzone :disabled="saving" :file-name="detail.program.proposal_file_name" @update:file="proposalFile = $event" />
            <label class="mt-3 block text-sm font-medium text-slate-700" for="prop-amount">Total Komitmen Anggaran Diajukan</label>
            <CurrencyInput id="prop-amount" v-model="proposalAmount" :disabled="saving" class="mt-1" />
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="saveProposal">
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
              <button v-if="proposalSaved" type="button" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editingProposal = false">
                Batal
              </button>
            </div>
          </template>

          <template v-else>
            <dl class="space-y-1 text-sm">
              <div class="flex gap-2">
                <dt class="text-slate-500">Berkas:</dt>
                <dd>
                  <button type="button" class="text-brand-600 hover:underline" @click="download(detail.program.proposal_file_id!, detail.program.proposal_file_name!)">
                    {{ detail.program.proposal_file_name }}
                  </button>
                </dd>
              </div>
              <div class="flex gap-2">
                <dt class="text-slate-500">Komitmen:</dt>
                <dd class="text-slate-900">{{ formatRupiah(detail.program.requested_amount) }}</dd>
              </div>
            </dl>
            <div v-if="canEditProposal(detail.program.status, auth.isSuperAdmin)" class="mt-3 flex gap-2">
              <button type="button" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editingProposal = true">Edit</button>
              <button type="button" :disabled="saving" class="rounded border border-red-300 px-3 py-2 text-sm text-red-600" @click="removeProposal">Hapus</button>
            </div>
          </template>
        </div>

        <div v-if="showLpj" class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Laporan &amp; LPJ</h2>

          <template v-if="showLpjInput">
            <FileDropzone :disabled="saving" :file-name="detail.program.lpj_file_name" @update:file="lpjFile = $event" />
            <label class="mt-3 block text-sm font-medium text-slate-700" for="lpj-amount">Total Realisasi Anggaran</label>
            <CurrencyInput id="lpj-amount" v-model="lpjAmount" :disabled="saving" class="mt-1" />
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="saveLpj">
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
              <button v-if="lpjSaved" type="button" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editingLpj = false">
                Batal
              </button>
            </div>
          </template>

          <template v-else>
            <dl class="space-y-1 text-sm">
              <div class="flex gap-2">
                <dt class="text-slate-500">Berkas:</dt>
                <dd>
                  <button type="button" class="text-brand-600 hover:underline" @click="download(detail.program.lpj_file_id!, detail.program.lpj_file_name!)">
                    {{ detail.program.lpj_file_name }}
                  </button>
                </dd>
              </div>
              <div class="flex gap-2">
                <dt class="text-slate-500">Realisasi:</dt>
                <dd class="text-slate-900">{{ formatRupiah(detail.program.actual_amount) }}</dd>
              </div>
            </dl>
            <div v-if="canEditLpj(detail.program.status, auth.isSuperAdmin)" class="mt-3 flex gap-2">
              <button type="button" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editingLpj = true">Edit</button>
              <button type="button" :disabled="saving" class="rounded border border-red-300 px-3 py-2 text-sm text-red-600" @click="removeLpj">Hapus</button>
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
