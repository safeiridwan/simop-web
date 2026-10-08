<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

import PersonPicker from '@/components/PersonPicker.vue'
import type { Person } from '@/modules/people/types'
import { activitiesApi } from '../api'
import { ATTENDANCE_STATUSES, PARTICIPANT_TYPES, type Activity, type ActivityAttendance, type ActivityParticipant } from '../types'

const props = defineProps<{
  programId: string
  unitId: string
  activities: Activity[]
  openActivity: string | null
}>()

const emit = defineEmits<{ changed: []; toggle: [id: string] }>()

const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive({ name: '', activity_date: '', location: '' })
const selectedPerson = ref<Person | null>(null)
const participantType = ref('PARTICIPANT')

const participants = ref<ActivityParticipant[]>([])
const attendance = ref<ActivityAttendance[]>([])

watch(
  () => props.openActivity,
  async (id) => {
    if (!id) return
    try {
      const [p, a] = await Promise.all([activitiesApi.listParticipants(id), activitiesApi.listAttendance(id)])
      participants.value = p
      attendance.value = a
    } catch {
      participants.value = []
      attendance.value = []
    }
  },
)

async function run(fn: () => Promise<unknown>) {
  saving.value = true
  error.value = null
  try {
    await fn()
    emit('changed')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Operasi gagal'
  } finally {
    saving.value = false
  }
}

function addActivity() {
  void run(async () => {
    await activitiesApi.create({
      program_id: props.programId,
      organization_unit_id: props.unitId,
      name: form.name,
      activity_date: form.activity_date || undefined,
      location: form.location || undefined,
    })
    form.name = ''
    form.activity_date = ''
    form.location = ''
  })
}

function addParticipant() {
  if (!selectedPerson.value || !props.openActivity) {
    error.value = 'Pilih orang terlebih dahulu.'
    return
  }
  void run(async () => {
    await activitiesApi.addParticipant(props.openActivity!, selectedPerson.value!.id, participantType.value)
    selectedPerson.value = null
    await reloadDetail()
  })
}

function recordAttendance(personId: string, event: Event) {
  const status = (event.target as HTMLSelectElement).value
  if (!status || !props.openActivity) return
  void run(async () => {
    await activitiesApi.recordAttendance(props.openActivity!, personId, status)
    await reloadDetail()
  })
}

async function reloadDetail() {
  if (!props.openActivity) return
  const [p, a] = await Promise.all([
    activitiesApi.listParticipants(props.openActivity),
    activitiesApi.listAttendance(props.openActivity),
  ])
  participants.value = p
  attendance.value = a
}

function attendanceFor(personId: string): string {
  return attendance.value.find((a) => a.person_id === personId)?.status ?? ''
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4">
    <h2 class="mb-3 font-semibold text-slate-900">Kegiatan</h2>
    <p v-if="error" class="mb-2 text-sm text-red-600">{{ error }}</p>

    <ul class="space-y-2 text-sm">
      <li v-for="a in activities" :key="a.id" class="rounded border border-slate-200 p-2">
        <button type="button" class="flex w-full items-center justify-between gap-2 text-left" @click="emit('toggle', a.id)">
          <span class="text-slate-900">
            {{ a.name }}
            <span class="block text-xs text-slate-500">{{ a.activity_date || '—' }} · {{ a.location || '—' }} · {{ a.status }}</span>
          </span>
          <span class="shrink-0 text-xs text-brand-600">{{ openActivity === a.id ? 'Tutup' : 'Kelola' }}</span>
        </button>

        <div v-if="openActivity === a.id" class="mt-3 space-y-3 border-t border-slate-100 pt-3">
          <div>
            <h3 class="mb-1 text-xs font-semibold uppercase text-slate-500">Peserta</h3>
            <div v-for="p in participants" :key="p.id" class="flex flex-wrap items-center justify-between gap-2 py-1">
              <span class="text-slate-700">{{ p.full_name }} <span class="text-xs text-slate-400">{{ p.participant_type }}</span></span>
              <select class="rounded border border-slate-300 px-2 py-1 text-xs" :disabled="saving" @change="recordAttendance(p.person_id, $event)">
                <option value="" :selected="attendanceFor(p.person_id) === ''" disabled>Kehadiran</option>
                <option v-for="a2 in ATTENDANCE_STATUSES" :key="a2.value" :value="a2.value" :selected="attendanceFor(p.person_id) === a2.value">
                  {{ a2.label }}
                </option>
              </select>
            </div>
            <p v-if="participants.length === 0" class="text-xs text-slate-500">Belum ada peserta.</p>
          </div>

          <form class="grid gap-2" @submit.prevent="addParticipant">
            <PersonPicker v-model="selectedPerson" />
            <select v-model="participantType" class="rounded border border-slate-300 px-3 py-2 text-sm">
              <option v-for="t in PARTICIPANT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
            <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:w-fit">
              Tambah Peserta
            </button>
          </form>
        </div>
      </li>
      <li v-if="activities.length === 0" class="text-slate-500">Belum ada kegiatan.</li>
    </ul>

    <form class="mt-4 grid gap-2 sm:grid-cols-3" @submit.prevent="addActivity">
      <input v-model="form.name" placeholder="Nama kegiatan" required class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-3" />
      <input v-model="form.activity_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.location" placeholder="Lokasi" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
        Tambah Kegiatan
      </button>
    </form>
  </div>
</template>
