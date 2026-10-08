<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import PersonPicker from '@/components/PersonPicker.vue'
import type { Person } from '@/modules/people/types'
import { useAuthStore } from '@/app/stores/auth'
import { meetingsApi } from '../api'
import { ATTENDANCE_STATUSES, ITEM_STATUSES, MEETING_STATUSES, type MeetingDetail } from '../types'

const route = useRoute()
const auth = useAuthStore()
const id = route.params.id as string

const detail = ref<MeetingDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const statusForm = reactive({ status: '' })
const selectedPerson = ref<Person | null>(null)
const agendaForm = reactive({ topic: '' })
const minutesForm = reactive({ content: '' })
const decisionForm = reactive({ decision_number: '', decision_text: '' })
const actionForm = reactive({ decision_id: '', assigned_to: '', description: '', due_date: '' })

const canUpdate = computed(() => auth.can('governance:update'))

async function load() {
  loading.value = true
  error.value = null
  try {
    detail.value = await meetingsApi.get(id)
    statusForm.status = detail.value.meeting.status
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat rapat'
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
  void run(() => meetingsApi.update(id, { status: statusForm.status }))
}

function addParticipant() {
  if (!selectedPerson.value) {
    error.value = 'Pilih orang terlebih dahulu.'
    return
  }
  void run(async () => {
    await meetingsApi.addParticipant(id, selectedPerson.value!.id)
    selectedPerson.value = null
  })
}

function onAttendance(participantId: string, event: Event) {
  const attendance = (event.target as HTMLSelectElement).value
  void run(() => meetingsApi.setAttendance(id, participantId, attendance))
}

function addAgenda() {
  void run(async () => {
    await meetingsApi.addAgenda(id, (detail.value?.agenda.length ?? 0) + 1, agendaForm.topic)
    agendaForm.topic = ''
  })
}

function addMinutes() {
  void run(async () => {
    await meetingsApi.addMinutes(id, minutesForm.content)
    minutesForm.content = ''
  })
}

function addDecision() {
  void run(async () => {
    await meetingsApi.addDecision(id, decisionForm.decision_number, decisionForm.decision_text)
    decisionForm.decision_number = ''
    decisionForm.decision_text = ''
  })
}

function addActionItem() {
  void run(async () => {
    await meetingsApi.addActionItem(id, {
      decision_id: actionForm.decision_id || undefined,
      description: actionForm.description,
      due_date: actionForm.due_date || undefined,
    })
    actionForm.description = ''
    actionForm.due_date = ''
    actionForm.decision_id = ''
  })
}

function setItemStatus(itemId: string, status: string) {
  void run(() => meetingsApi.setActionItemStatus(id, itemId, status))
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="detail">
      <header class="mb-6">
        <router-link to="/meetings" class="text-sm text-brand-600 hover:underline">← Rapat</router-link>
        <h1 class="text-xl font-semibold text-slate-900">{{ detail.meeting.title }}</h1>
        <p class="text-sm text-slate-500">
          {{ detail.meeting.meeting_type || '—' }} ·
          {{ detail.meeting.start_at ? new Date(detail.meeting.start_at).toLocaleString('id-ID') : '—' }} ·
          {{ detail.meeting.location || '—' }}
        </p>
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Status</h2>
          <form v-if="canUpdate" class="flex flex-wrap items-end gap-2" @submit.prevent="saveStatus">
            <select v-model="statusForm.status" class="rounded border border-slate-300 px-3 py-2 text-sm">
              <option v-for="s in MEETING_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Simpan</button>
          </form>
          <p v-else class="text-sm text-slate-600">{{ detail.meeting.status }}</p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Peserta ({{ detail.participants.length }})</h2>
          <ul class="mb-3 space-y-2 text-sm">
            <li v-for="p in detail.participants" :key="p.id" class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-slate-900">{{ p.full_name }}</span>
              <select
                :value="p.attendance"
                class="rounded border border-slate-300 px-2 py-1 text-xs"
                :disabled="saving || !canUpdate"
                @change="onAttendance(p.id, $event)"
              >
                <option v-for="a in ATTENDANCE_STATUSES" :key="a.value" :value="a.value">{{ a.label }}</option>
              </select>
            </li>
            <li v-if="detail.participants.length === 0" class="text-slate-500">Belum ada peserta.</li>
          </ul>
          <form v-if="canUpdate" class="grid gap-2 sm:grid-cols-[1fr_auto]" @submit.prevent="addParticipant">
            <PersonPicker v-model="selectedPerson" />
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Tambah</button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Agenda</h2>
          <ol class="mb-3 list-decimal space-y-1 pl-5 text-sm">
            <li v-for="a in detail.agenda" :key="a.id" class="text-slate-900">{{ a.topic }}</li>
            <li v-if="detail.agenda.length === 0" class="list-none text-slate-500">Belum ada agenda.</li>
          </ol>
          <form v-if="canUpdate" class="grid gap-2 sm:grid-cols-[1fr_auto]" @submit.prevent="addAgenda">
            <input v-model="agendaForm.topic" placeholder="Topik agenda" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Tambah</button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Notulen</h2>
          <ul class="mb-3 space-y-2 text-sm">
            <li v-for="m in detail.minutes" :key="m.id" class="rounded border border-slate-100 p-2 text-slate-700">{{ m.content }}</li>
            <li v-if="detail.minutes.length === 0" class="text-slate-500">Belum ada notulen.</li>
          </ul>
          <form v-if="canUpdate" class="grid gap-2" @submit.prevent="addMinutes">
            <textarea v-model="minutesForm.content" rows="2" placeholder="Isi notulen" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm sm:w-fit">Tambah Notulen</button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
          <h2 class="mb-3 font-semibold text-slate-900">Keputusan</h2>
          <ul class="mb-3 space-y-2 text-sm">
            <li v-for="d in detail.decisions" :key="d.id" class="rounded border border-slate-100 p-2">
              <span class="text-slate-900">{{ d.decision_text }}</span>
              <span v-if="d.decision_number" class="block text-xs text-slate-500">{{ d.decision_number }}</span>
            </li>
            <li v-if="detail.decisions.length === 0" class="text-slate-500">Belum ada keputusan.</li>
          </ul>
          <form v-if="canUpdate" class="grid gap-2 sm:grid-cols-[1fr_2fr_auto]" @submit.prevent="addDecision">
            <input v-model="decisionForm.decision_number" placeholder="Nomor" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="decisionForm.decision_text" placeholder="Isi keputusan" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Tambah</button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
          <h2 class="mb-3 font-semibold text-slate-900">Tindak Lanjut</h2>
          <ul class="mb-3 space-y-2 text-sm">
            <li v-for="it in detail.action_items" :key="it.id" class="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-100 p-2">
              <span>
                <span class="block text-slate-900">{{ it.description }}</span>
                <span class="text-xs text-slate-500">{{ it.assignee_name || '—' }} · {{ it.due_date || '—' }}</span>
              </span>
              <select
                :value="it.status"
                class="rounded border border-slate-300 px-2 py-1 text-xs"
                :disabled="saving || !canUpdate"
                @change="setItemStatus(it.id, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="s in ITEM_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </li>
            <li v-if="detail.action_items.length === 0" class="text-slate-500">Belum ada tindak lanjut.</li>
          </ul>
          <form v-if="canUpdate" class="grid gap-2 sm:grid-cols-[1fr_2fr_1fr_auto]" @submit.prevent="addActionItem">
            <select v-model="actionForm.decision_id" class="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">— Keputusan —</option>
              <option v-for="d in detail.decisions" :key="d.id" :value="d.id">{{ d.decision_text }}</option>
            </select>
            <input v-model="actionForm.description" placeholder="Tindak lanjut" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="actionForm.due_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Tambah</button>
          </form>
        </div>
      </div>
    </template>
  </section>
</template>
