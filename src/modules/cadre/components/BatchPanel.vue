<script setup lang="ts">
import { ref, watch } from 'vue'

import PersonPicker from '@/components/PersonPicker.vue'
import type { Person } from '@/modules/people/types'
import { cadreApi } from '../api'
import { ASSESSMENT_RESULTS, ATTENDANCE_STATUSES, PARTICIPANT_STATUSES, type Batch, type BatchDetail } from '../types'

const props = defineProps<{ batch: Batch }>()
const emit = defineEmits<{ changed: [] }>()

const detail = ref<BatchDetail | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const selectedPerson = ref<Person | null>(null)
const sessionForm = ref({ session_date: '', topic: '', facilitator: '' })
const openSession = ref<string | null>(null)
const assessInput = ref<Record<string, { score: string; result: string }>>({})
const certInput = ref<Record<string, string>>({})

async function load() {
  loading.value = true
  error.value = null
  try {
    detail.value = await cadreApi.getBatch(props.batch.id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat angkatan'
  } finally {
    loading.value = false
  }
}

watch(() => props.batch.id, load, { immediate: true })

async function run(fn: () => Promise<unknown>) {
  saving.value = true
  error.value = null
  try {
    await fn()
    await load()
    emit('changed')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Operasi gagal'
  } finally {
    saving.value = false
  }
}

function addParticipant() {
  if (!selectedPerson.value) {
    error.value = 'Pilih orang terlebih dahulu.'
    return
  }
  void run(async () => {
    await cadreApi.addParticipant(props.batch.id, selectedPerson.value!.id)
    selectedPerson.value = null
  })
}

function addSession() {
  void run(async () => {
    await cadreApi.createSession(props.batch.id, {
      session_date: sessionForm.value.session_date || undefined,
      topic: sessionForm.value.topic || undefined,
      facilitator: sessionForm.value.facilitator || undefined,
    })
    sessionForm.value = { session_date: '', topic: '', facilitator: '' }
  })
}

function assess(participantId: string) {
  const input = assessInput.value[participantId] ?? { score: '', result: 'PENDING' }
  void run(() =>
    cadreApi.assess(participantId, {
      score: input.score ? Number(input.score) : undefined,
      result: input.result,
    }),
  )
}

function issueCertificate(participantId: string) {
  const number = certInput.value[participantId]
  if (!number) {
    error.value = 'Isi nomor sertifikat terlebih dahulu.'
    return
  }
  void run(() => cadreApi.issueCertificate(participantId, number))
}

function attend(sessionId: string, participantId: string, status: string) {
  void run(() => cadreApi.recordAttendance(sessionId, participantId, status))
}

function onStatusChange(participantId: string, event: Event) {
  const status = (event.target as HTMLSelectElement).value
  void run(() => cadreApi.updateParticipant(participantId, status))
}

function onAttendChange(sessionId: string, participantId: string, event: Event) {
  attend(sessionId, participantId, (event.target as HTMLSelectElement).value)
}

function onScoreInput(participantId: string, event: Event) {
  assessInput.value[participantId] = {
    score: (event.target as HTMLInputElement).value,
    result: assessInput.value[participantId]?.result ?? 'PENDING',
  }
}

function onResultChange(participantId: string, event: Event) {
  assessInput.value[participantId] = {
    score: assessInput.value[participantId]?.score ?? '',
    result: (event.target as HTMLSelectElement).value,
  }
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4">
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="detail">
      <h3 class="mb-3 text-sm font-semibold text-slate-900">Peserta ({{ detail.participants.length }})</h3>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-left text-slate-500">
              <th class="py-2 pr-4">Nama</th>
              <th class="py-2 pr-4">Status</th>
              <th class="py-2 pr-4">Nilai</th>
              <th class="py-2">Sertifikat</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in detail.participants" :key="p.id" class="border-b border-slate-100">
              <td class="py-2 pr-4 text-slate-900">{{ p.full_name }}</td>
              <td class="py-2 pr-4">
                <select
                  :value="p.status"
                  class="rounded border border-slate-300 px-2 py-1 text-xs"
                  :disabled="saving"
                  @change="onStatusChange(p.id, $event)"
                >
                  <option v-for="s in PARTICIPANT_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </td>
              <td class="py-2 pr-4">
                <div class="flex flex-wrap items-center gap-1">
                  <input
                    :value="assessInput[p.id]?.score ?? ''"
                    placeholder="Nilai"
                    class="w-16 rounded border border-slate-300 px-2 py-1 text-xs"
                    @input="onScoreInput(p.id, $event)"
                  />
                  <select
                    :value="assessInput[p.id]?.result ?? 'PENDING'"
                    class="rounded border border-slate-300 px-2 py-1 text-xs"
                    @change="onResultChange(p.id, $event)"
                  >
                    <option v-for="r in ASSESSMENT_RESULTS" :key="r.value" :value="r.value">{{ r.label }}</option>
                  </select>
                  <button type="button" class="rounded border border-slate-300 px-2 py-1 text-xs" :disabled="saving" @click="assess(p.id)">
                    Nilai
                  </button>
                </div>
              </td>
              <td class="py-2">
                <div class="flex flex-wrap items-center gap-1">
                  <input v-model="certInput[p.id]" placeholder="No. sertifikat" class="w-28 rounded border border-slate-300 px-2 py-1 text-xs" />
                  <button type="button" class="rounded border border-slate-300 px-2 py-1 text-xs" :disabled="saving" @click="issueCertificate(p.id)">
                    Terbitkan
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="detail.participants.length === 0">
              <td colspan="4" class="py-2 text-slate-500">Belum ada peserta.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <form class="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]" @submit.prevent="addParticipant">
        <PersonPicker v-model="selectedPerson" />
        <button type="submit" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:w-fit" :disabled="saving">
          Tambah Peserta
        </button>
      </form>

      <h3 class="mb-3 mt-6 text-sm font-semibold text-slate-900">Sesi ({{ detail.sessions.length }})</h3>
      <ul class="mb-3 space-y-2 text-sm">
        <li v-for="s in detail.sessions" :key="s.id" class="rounded border border-slate-200 p-2">
          <button type="button" class="flex w-full items-center justify-between text-left" @click="openSession = openSession === s.id ? null : s.id">
            <span class="text-slate-900">{{ s.topic || 'Sesi' }} <span class="text-xs text-slate-500">{{ s.session_date || '—' }}</span></span>
            <span class="text-xs text-brand-600">{{ openSession === s.id ? 'Tutup' : 'Absensi' }}</span>
          </button>
          <div v-if="openSession === s.id" class="mt-2 space-y-1 border-t border-slate-100 pt-2">
            <div v-for="p in detail.participants" :key="p.id" class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-slate-700">{{ p.full_name }}</span>
              <select class="rounded border border-slate-300 px-2 py-1 text-xs" :disabled="saving" @change="onAttendChange(s.id, p.id, $event)">
                <option value="" disabled selected>Pilih kehadiran</option>
                <option v-for="a in ATTENDANCE_STATUSES" :key="a.value" :value="a.value">{{ a.label }}</option>
              </select>
            </div>
            <p v-if="detail.participants.length === 0" class="text-xs text-slate-500">Belum ada peserta.</p>
          </div>
        </li>
        <li v-if="detail.sessions.length === 0" class="text-slate-500">Belum ada sesi.</li>
      </ul>

      <form class="grid gap-2 sm:grid-cols-3" @submit.prevent="addSession">
        <input v-model="sessionForm.session_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input v-model="sessionForm.topic" placeholder="Topik" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input v-model="sessionForm.facilitator" placeholder="Fasilitator" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-3 sm:w-fit" :disabled="saving">
          Tambah Sesi
        </button>
      </form>
    </template>
  </div>
</template>
