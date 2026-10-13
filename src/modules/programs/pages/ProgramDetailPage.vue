<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppModal from '@/components/AppModal.vue'
import { useAuthStore } from '@/app/stores/auth'
import { downloadFile } from '@/services/http'
import { programsApi } from '../api'
import { isSectionLocked, PROGRAM_TRANSITIONS, programStatusLabel, type ProgramDetail } from '../types'

const route = useRoute()
const auth = useAuthStore()
const id = route.params.id as string

const detail = ref<ProgramDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const modalMessage = ref('')
const proposalAmount = ref('')
const lpjAmount = ref('')

const status = computed(() => detail.value?.program.status ?? '')
const canEditSections = computed(() => !isSectionLocked(status.value) || auth.isSuperAdmin)

function transitions() {
  if (!detail.value) return []
  return PROGRAM_TRANSITIONS[detail.value.program.status] ?? []
}

async function load() {
  loading.value = true
  error.value = null
  try {
    detail.value = await programsApi.get(id)
    proposalAmount.value = detail.value.program.requested_amount != null ? String(detail.value.program.requested_amount) : ''
    lpjAmount.value = detail.value.program.actual_amount != null ? String(detail.value.program.actual_amount) : ''
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
    modalMessage.value = err instanceof Error ? err.message : 'Operasi gagal'
  } finally {
    saving.value = false
  }
}

function transition(action: string) {
  void run(() => programsApi.transition(id, action))
}

function numberOrNull(value: string): number | null {
  return value === '' ? null : Number(value)
}

function uploadProposal(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  void run(async () => {
    const uploaded = await programsApi.uploadFile(id, file)
    await programsApi.setProposal(id, { proposal_file_id: uploaded.file_id, requested_amount: numberOrNull(proposalAmount.value) })
  })
}

function saveProposal() {
  void run(() =>
    programsApi.setProposal(id, {
      proposal_file_id: detail.value?.program.proposal_file_id ?? null,
      requested_amount: numberOrNull(proposalAmount.value),
    }),
  )
}

function removeProposal() {
  void run(() => programsApi.setProposal(id, { proposal_file_id: null, requested_amount: numberOrNull(proposalAmount.value) }))
}

function uploadLpj(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  void run(async () => {
    const uploaded = await programsApi.uploadFile(id, file)
    await programsApi.setLpj(id, { lpj_file_id: uploaded.file_id, actual_amount: numberOrNull(lpjAmount.value) })
  })
}

function saveLpj() {
  void run(() =>
    programsApi.setLpj(id, {
      lpj_file_id: detail.value?.program.lpj_file_id ?? null,
      actual_amount: numberOrNull(lpjAmount.value),
    }),
  )
}

function removeLpj() {
  void run(() => programsApi.setLpj(id, { lpj_file_id: null, actual_amount: numberOrNull(lpjAmount.value) }))
}

async function download(fileId: string, filename: string) {
  try {
    await downloadFile(`/api/v1/files/${fileId}`, filename)
  } catch {
    modalMessage.value = 'Gagal mengunduh berkas'
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
          <p class="mb-3 text-sm text-slate-600">
            <button
              v-if="detail.program.proposal_file_id && detail.program.proposal_file_name"
              type="button"
              class="text-brand-600 hover:underline"
              @click="download(detail.program.proposal_file_id, detail.program.proposal_file_name)"
            >
              {{ detail.program.proposal_file_name }}
            </button>
            <span v-else class="text-slate-500">Belum ada berkas proposal.</span>
          </p>
          <label class="block text-sm font-medium text-slate-700" for="prop-amount">Total Komitmen Anggaran Diajukan</label>
          <input
            id="prop-amount"
            v-model="proposalAmount"
            type="number"
            step="0.01"
            :disabled="saving || !canEditSections"
            class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          />
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <input type="file" :disabled="saving || !canEditSections" class="text-sm" @change="uploadProposal" />
            <button type="button" :disabled="saving || !canEditSections" class="text-sm text-brand-600 hover:underline disabled:opacity-50" @click="saveProposal">
              Simpan
            </button>
            <button
              v-if="detail.program.proposal_file_id"
              type="button"
              :disabled="saving || !canEditSections"
              class="text-sm text-red-600 hover:underline disabled:opacity-50"
              @click="removeProposal"
            >
              Hapus Berkas
            </button>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Laporan &amp; LPJ</h2>
          <p class="mb-3 text-sm text-slate-600">
            <button
              v-if="detail.program.lpj_file_id && detail.program.lpj_file_name"
              type="button"
              class="text-brand-600 hover:underline"
              @click="download(detail.program.lpj_file_id, detail.program.lpj_file_name)"
            >
              {{ detail.program.lpj_file_name }}
            </button>
            <span v-else class="text-slate-500">Belum ada berkas LPJ.</span>
          </p>
          <label class="block text-sm font-medium text-slate-700" for="lpj-amount">Total Realisasi Anggaran</label>
          <input
            id="lpj-amount"
            v-model="lpjAmount"
            type="number"
            step="0.01"
            :disabled="saving || !canEditSections"
            class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          />
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <input type="file" :disabled="saving || !canEditSections" class="text-sm" @change="uploadLpj" />
            <button type="button" :disabled="saving || !canEditSections" class="text-sm text-brand-600 hover:underline disabled:opacity-50" @click="saveLpj">
              Simpan
            </button>
            <button
              v-if="detail.program.lpj_file_id"
              type="button"
              :disabled="saving || !canEditSections"
              class="text-sm text-red-600 hover:underline disabled:opacity-50"
              @click="removeLpj"
            >
              Hapus Berkas
            </button>
          </div>
        </div>
      </div>

      <p v-if="!canEditSections" class="mt-4 text-xs text-slate-500">
        Bagian Proposal dan LPJ terkunci setelah program disetujui. Hanya Super Admin yang dapat mengubahnya.
      </p>
    </template>

    <AppModal :open="modalMessage !== ''" :message="modalMessage" @close="modalMessage = ''" />
  </section>
</template>
