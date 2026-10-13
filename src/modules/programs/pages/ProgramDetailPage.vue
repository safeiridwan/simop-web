<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppModal from '@/components/AppModal.vue'
import FileDropzone from '@/components/FileDropzone.vue'
import { useAuthStore } from '@/app/stores/auth'
import { downloadFile } from '@/services/http'
import { programsApi } from '../api'
import {
  canEditLpj,
  canEditProposal,
  lpjVisible,
  PROGRAM_TRANSITIONS,
  programStatusLabel,
  type ProgramDetail,
} from '../types'

const route = useRoute()
const auth = useAuthStore()
const id = route.params.id as string

const detail = ref<ProgramDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const status = computed(() => detail.value?.program.status ?? '')

const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')
const confirmMessage = ref('')
let confirmAction: (() => Promise<void>) | null = null

// Proposal section state.
const proposalAmount = ref('')
const proposalFile = ref<File | null>(null)
const editingProposal = ref(false)
// LPJ section state.
const lpjAmount = ref('')
const lpjFile = ref<File | null>(null)
const editingLpj = ref(false)

const proposalSaved = computed(() => !!detail.value?.program.proposal_file_id && detail.value?.program.requested_amount != null)
const lpjSaved = computed(() => !!detail.value?.program.lpj_file_id && detail.value?.program.actual_amount != null)

const showLpj = computed(() => lpjVisible(status.value) || !!detail.value?.program.lpj_file_id)
const showProposalInput = computed(() => !proposalSaved.value || editingProposal.value)
const showLpjInput = computed(() => !lpjSaved.value || editingLpj.value)

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
    detail.value = await programsApi.get(id)
    proposalAmount.value = detail.value.program.requested_amount != null ? String(detail.value.program.requested_amount) : ''
    lpjAmount.value = detail.value.program.actual_amount != null ? String(detail.value.program.actual_amount) : ''
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

function amount(value: string): number | null {
  return value === '' ? null : Number(value)
}

async function saveProposal() {
  if (!detail.value) return
  const file = proposalFile.value
  const existing = detail.value.program.proposal_file_id
  if (!file && !existing) {
    notify('Lengkapi berkas Proposal terlebih dahulu sebelum menyimpan.', 'Data Belum Lengkap')
    return
  }
  const nominal = amount(proposalAmount.value)
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
  const nominal = amount(lpjAmount.value)
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
          <router-link to="/programs" class="text-sm text-brand-600 hover:underline">← Program</router-link>
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
        </div>
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Proposal</h2>

          <template v-if="showProposalInput">
            <FileDropzone :disabled="saving" :file-name="detail.program.proposal_file_name" @update:file="proposalFile = $event" />
            <label class="mt-3 block text-sm font-medium text-slate-700" for="prop-amount">Total Komitmen Anggaran Diajukan</label>
            <input id="prop-amount" v-model="proposalAmount" type="number" step="0.01" min="0" :disabled="saving" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
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
                <dd class="text-slate-900">{{ detail.program.requested_amount?.toLocaleString('id-ID') }}</dd>
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
            <input id="lpj-amount" v-model="lpjAmount" type="number" step="0.01" min="0" :disabled="saving" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
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
                <dd class="text-slate-900">{{ detail.program.actual_amount?.toLocaleString('id-ID') }}</dd>
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
