<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppModal from '@/components/AppModal.vue'
import { useAuthStore } from '@/app/stores/auth'
import { CADRE_STATUSES } from '@/modules/cadre/types'
import { kaderisasiApi } from '../api'
import { GROUP_STATUSES, groupStatusLabel, type GroupDetail, type GroupMemberRow, type Level } from '../types'
import CadrePicker from '../components/CadrePicker.vue'
import GroupMemberEditor from '../components/GroupMemberEditor.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const id = route.params.id as string

const detail = ref<GroupDetail | null>(null)
const levels = ref<Level[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const editing = ref(false)
const editForm = reactive({ name: '', murabbi_cadre_profile_id: '', level_id: '', status: 'ACTIVE' })
const editMembers = ref<GroupMemberRow[]>([])

const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')
const confirmMessage = ref('')
let confirmAction: (() => Promise<void>) | null = null

const canUpdate = computed(() => auth.can('kaderisasi:update'))
const group = computed(() => detail.value?.group ?? null)

function statusLabel(status: string): string {
  return CADRE_STATUSES.find((s) => s.value === status)?.label ?? status
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
    const [d, lv] = await Promise.all([kaderisasiApi.getGroup(id), kaderisasiApi.levels()])
    detail.value = d
    levels.value = lv
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat grup'
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

function startEdit() {
  const g = group.value!
  editForm.name = g.name
  editForm.murabbi_cadre_profile_id = g.murabbi_cadre_profile_id ?? ''
  editForm.level_id = g.level_id ?? ''
  editForm.status = g.status
  editMembers.value = (detail.value?.members ?? []).map((m) => ({
    cadre_profile_id: m.cadre_profile_id,
    full_name: m.full_name,
    person_code: m.person_code,
    level_name: m.level_name,
    status: m.status,
  }))
  editing.value = true
}

function validateEdit(): string | null {
  const missing: string[] = []
  if (!editForm.name.trim()) missing.push('Nama Grup')
  if (!editForm.murabbi_cadre_profile_id) missing.push('Murabbi')
  if (!editForm.level_id) missing.push('Jenjang')
  if (!editForm.status) missing.push('Status')
  if (missing.length > 0) {
    return `Field berikut wajib diisi: ${missing.join(', ')}.`
  }
  const ids = editMembers.value.map((m) => m.cadre_profile_id).filter(Boolean)
  if (ids.includes(editForm.murabbi_cadre_profile_id)) {
    return 'Murabbi tidak boleh menjadi anggota grup yang dibinanya.'
  }
  if (new Set(ids).size !== ids.length) {
    return 'Satu kader tidak boleh muncul lebih dari sekali dalam satu grup.'
  }
  return null
}

function saveEdit() {
  const validation = validateEdit()
  if (validation) {
    notify(validation, 'Data Belum Lengkap')
    return
  }
  void run(async () => {
    await kaderisasiApi.updateGroup(id, {
      name: editForm.name,
      murabbi_cadre_profile_id: editForm.murabbi_cadre_profile_id,
      level_id: editForm.level_id,
      status: editForm.status,
      member_ids: editMembers.value.map((m) => m.cadre_profile_id).filter(Boolean),
    })
    editing.value = false
  })
}

function removeGroup() {
  askConfirm('Hapus grup pembinaan ini?', async () => {
    await run(async () => {
      await kaderisasiApi.deleteGroup(id)
      await router.push('/kaderisasi/grup-pembinaan')
    })
  })
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="detail && group">
      <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <router-link to="/kaderisasi/grup-pembinaan" class="text-sm text-brand-600 hover:underline">← Grup Pembinaan</router-link>
          <h1 class="text-xl font-semibold text-slate-900">{{ group.name }}</h1>
        </div>
        <div v-if="canUpdate" class="flex gap-2">
          <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editing ? (editing = false) : startEdit()">
            {{ editing ? 'Batal' : 'Edit' }}
          </button>
          <button type="button" class="rounded border border-red-300 px-3 py-2 text-sm text-red-600" @click="removeGroup">Hapus</button>
        </div>
      </header>

      <div class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Header</h2>
        <dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt class="text-slate-500">Nama</dt><dd class="text-slate-900">{{ group.name }}</dd></div>
          <div><dt class="text-slate-500">Murabbi</dt><dd class="text-slate-900">{{ group.murabbi || '—' }}</dd></div>
          <div><dt class="text-slate-500">Jenjang</dt><dd class="text-slate-900">{{ group.level_name || '—' }}</dd></div>
          <div><dt class="text-slate-500">Status</dt><dd class="text-slate-900">{{ groupStatusLabel(group.status) }}</dd></div>
        </dl>
      </div>

      <form v-if="editing" class="mb-6 space-y-4 rounded-lg border border-slate-200 bg-white p-4" @submit.prevent="saveEdit">
        <h2 class="font-semibold text-slate-900">Header</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700" for="ge-name">Nama Grup</label>
            <input id="ge-name" v-model="editForm.name" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Murabbi</label>
            <div class="mt-1">
              <CadrePicker v-model="editForm.murabbi_cadre_profile_id" :disabled="saving" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="ge-level">Jenjang</label>
            <select id="ge-level" v-model="editForm.level_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="" disabled>Pilih jenjang</option>
              <option v-for="l in levels" :key="l.id" :value="l.id">{{ l.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="ge-status">Status</label>
            <select id="ge-status" v-model="editForm.status" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="" disabled>Pilih status</option>
              <option v-for="s in GROUP_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
        </div>

        <h2 class="font-semibold text-slate-900">Detail Anggota</h2>
        <GroupMemberEditor v-model="editMembers" :disabled="saving" />

        <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
          {{ saving ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </form>

      <div v-else class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Detail Anggota ({{ detail.members.length }})</h2>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-slate-500">
                <th class="py-2 pr-4">Kader</th>
                <th class="py-2 pr-4">Jenjang</th>
                <th class="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in detail.members" :key="m.id" class="border-b border-slate-100">
                <td class="py-2 pr-4 text-slate-900">{{ m.person_code }} - {{ m.full_name }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ m.level_name }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ statusLabel(m.status) }}</td>
              </tr>
              <tr v-if="detail.members.length === 0"><td colspan="3" class="py-3 text-slate-500">Belum ada anggota.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <AppModal :open="modalMessage !== ''" :title="modalTitle" :message="modalMessage" @close="modalMessage = ''" />
    <AppModal :open="confirmMessage !== ''" variant="confirm" title="Konfirmasi" :message="confirmMessage" @close="confirmMessage = ''" @confirm="runConfirm" />
  </section>
</template>
