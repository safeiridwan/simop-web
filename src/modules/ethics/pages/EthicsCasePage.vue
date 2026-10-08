<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useAuthStore } from '@/app/stores/auth'
import { ethicsApi } from '../api'
import { ETHICS_STATUSES, ethicsStatusLabel, type EthicsCaseDetail } from '../types'

const route = useRoute()
const auth = useAuthStore()
const id = route.params.id as string

const detail = ref<EthicsCaseDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const statusForm = reactive({ status: '' })
const reportForm = reactive({ content: '', is_anonymous: false })
const investigationForm = reactive({ findings: '', status: 'OPEN' })
const evidenceForm = reactive({ description: '' })
const hearingForm = reactive({ scheduled_at: '', location: '', status: 'SCHEDULED' })
const decisionForm = reactive({ decision_number: '', decision_text: '', sanction_type: '', effective_at: '' })

const canInvestigate = computed(() => auth.can('ethics:investigate'))
const canDecide = computed(() => auth.can('ethics:decide'))

async function load() {
  loading.value = true
  error.value = null
  try {
    detail.value = await ethicsApi.get(id)
    statusForm.status = detail.value.case.status
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat kasus'
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

function saveStatus() {
  void run(() => ethicsApi.update(id, { status: statusForm.status }))
}

function addReport() {
  void run(async () => {
    await ethicsApi.addReport(id, { content: reportForm.content, is_anonymous: reportForm.is_anonymous })
    reportForm.content = ''
    reportForm.is_anonymous = false
  })
}

function addInvestigation() {
  void run(async () => {
    await ethicsApi.addInvestigation(id, { findings: investigationForm.findings || undefined, status: investigationForm.status })
    investigationForm.findings = ''
  })
}

function addEvidence() {
  void run(async () => {
    await ethicsApi.addEvidence(id, { description: evidenceForm.description })
    evidenceForm.description = ''
  })
}

function addHearing() {
  void run(async () => {
    await ethicsApi.addHearing(id, {
      scheduled_at: hearingForm.scheduled_at ? new Date(hearingForm.scheduled_at).toISOString() : undefined,
      location: hearingForm.location || undefined,
      status: hearingForm.status,
    })
    hearingForm.scheduled_at = ''
    hearingForm.location = ''
  })
}

function addDecision() {
  void run(async () => {
    await ethicsApi.addDecision(id, {
      decision_number: decisionForm.decision_number || undefined,
      decision_text: decisionForm.decision_text,
      sanctions: decisionForm.sanction_type
        ? [{ sanction_type: decisionForm.sanction_type, effective_at: decisionForm.effective_at || undefined }]
        : undefined,
    })
    decisionForm.decision_number = ''
    decisionForm.decision_text = ''
    decisionForm.sanction_type = ''
    decisionForm.effective_at = ''
  })
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="detail">
      <header class="mb-4">
        <router-link to="/ethics/cases" class="text-sm text-brand-600 hover:underline">← Etik</router-link>
        <h1 class="text-xl font-semibold text-slate-900">{{ detail.case.title }}</h1>
        <p class="font-mono text-xs text-slate-500">{{ detail.case.case_number }} · {{ detail.case.confidentiality }}</p>
      </header>

      <p class="mb-6 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
        Kasus etik bersifat rahasia. Tangani sesuai kode etik dan peraturan organisasi.
      </p>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Status</h2>
          <form v-if="canInvestigate" class="flex flex-wrap items-end gap-2" @submit.prevent="saveStatus">
            <select v-model="statusForm.status" class="rounded border border-slate-300 px-3 py-2 text-sm">
              <option v-for="s in ETHICS_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Simpan</button>
          </form>
          <p v-else class="text-sm text-slate-600">{{ ethicsStatusLabel(detail.case.status) }}</p>
          <p v-if="detail.case.description" class="mt-3 text-sm text-slate-600">{{ detail.case.description }}</p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Laporan ({{ detail.reports.length }})</h2>
          <ul class="mb-3 space-y-2 text-sm">
            <li v-for="r in detail.reports" :key="r.id" class="rounded border border-slate-100 p-2 text-slate-700">
              {{ r.content }}
              <span v-if="r.is_anonymous" class="block text-xs text-slate-400">Anonim</span>
            </li>
            <li v-if="detail.reports.length === 0" class="text-slate-500">Belum ada laporan.</li>
          </ul>
          <form v-if="canInvestigate" class="grid gap-2" @submit.prevent="addReport">
            <textarea v-model="reportForm.content" rows="2" placeholder="Isi laporan" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <label class="flex items-center gap-2 text-sm text-slate-600">
              <input v-model="reportForm.is_anonymous" type="checkbox" /> Anonim
            </label>
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm sm:w-fit">Tambah Laporan</button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Investigasi ({{ detail.investigations.length }})</h2>
          <ul class="mb-3 space-y-2 text-sm">
            <li v-for="i in detail.investigations" :key="i.id" class="rounded border border-slate-100 p-2 text-slate-700">
              {{ i.findings || '—' }} <span class="text-xs text-slate-400">{{ i.status }}</span>
            </li>
            <li v-if="detail.investigations.length === 0" class="text-slate-500">Belum ada investigasi.</li>
          </ul>
          <form v-if="canInvestigate" class="grid gap-2" @submit.prevent="addInvestigation">
            <textarea v-model="investigationForm.findings" rows="2" placeholder="Temuan" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <select v-model="investigationForm.status" class="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="OPEN">Berjalan</option>
              <option value="COMPLETED">Selesai</option>
            </select>
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm sm:w-fit">Tambah Investigasi</button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Bukti ({{ detail.evidence.length }})</h2>
          <ul class="mb-3 space-y-2 text-sm">
            <li v-for="e in detail.evidence" :key="e.id" class="rounded border border-slate-100 p-2 text-slate-700">{{ e.description }}</li>
            <li v-if="detail.evidence.length === 0" class="text-slate-500">Belum ada bukti.</li>
          </ul>
          <form v-if="canInvestigate" class="grid gap-2 sm:grid-cols-[1fr_auto]" @submit.prevent="addEvidence">
            <input v-model="evidenceForm.description" placeholder="Deskripsi bukti" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Tambah</button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Sidang ({{ detail.hearings.length }})</h2>
          <ul class="mb-3 space-y-2 text-sm">
            <li v-for="h in detail.hearings" :key="h.id" class="rounded border border-slate-100 p-2 text-slate-700">
              {{ h.scheduled_at ? new Date(h.scheduled_at).toLocaleString('id-ID') : '—' }} · {{ h.location || '—' }}
              <span class="text-xs text-slate-400">{{ h.status }}</span>
            </li>
            <li v-if="detail.hearings.length === 0" class="text-slate-500">Belum ada sidang.</li>
          </ul>
          <form v-if="canInvestigate" class="grid gap-2 sm:grid-cols-2" @submit.prevent="addHearing">
            <input v-model="hearingForm.scheduled_at" type="datetime-local" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="hearingForm.location" placeholder="Lokasi" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <select v-model="hearingForm.status" class="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="SCHEDULED">Dijadwalkan</option>
              <option value="HELD">Digelar</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Tambah Sidang</button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
          <h2 class="mb-3 font-semibold text-slate-900">Keputusan &amp; Sanksi</h2>
          <ul class="mb-3 space-y-2 text-sm">
            <li v-for="d in detail.decisions" :key="d.id" class="rounded border border-slate-100 p-2">
              <span class="text-slate-900">{{ d.decision_text }}</span>
              <span v-if="d.decision_number" class="block text-xs text-slate-500">{{ d.decision_number }}</span>
            </li>
            <li v-if="detail.decisions.length === 0" class="text-slate-500">Belum ada keputusan.</li>
          </ul>
          <ul v-if="detail.sanctions.length" class="mb-3 space-y-1 text-sm">
            <li v-for="s in detail.sanctions" :key="s.id" class="text-slate-600">
              Sanksi: {{ s.sanction_type }} <span v-if="s.effective_at">· {{ s.effective_at }}</span>
            </li>
          </ul>
          <form v-if="canDecide" class="grid gap-2 sm:grid-cols-2" @submit.prevent="addDecision">
            <input v-model="decisionForm.decision_number" placeholder="Nomor keputusan" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="decisionForm.sanction_type" placeholder="Jenis sanksi (opsional)" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <textarea v-model="decisionForm.decision_text" rows="2" placeholder="Isi keputusan" required class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
            <input v-model="decisionForm.effective_at" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm sm:w-fit">Tambah Keputusan</button>
          </form>
          <p v-else-if="!canInvestigate" class="text-sm text-slate-500">Anda hanya dapat melihat kasus ini.</p>
        </div>
      </div>
    </template>
  </section>
</template>
