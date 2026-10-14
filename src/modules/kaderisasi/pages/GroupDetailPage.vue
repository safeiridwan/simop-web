<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppModal from '@/components/AppModal.vue'
import { useAuthStore } from '@/app/stores/auth'
import { cadreApi } from '@/modules/cadre/api'
import type { CadreProfile } from '@/modules/cadre/types'
import { kaderisasiApi } from '../api'
import { GROUP_STATUSES, groupStatusLabel, type GroupDetail, type Level } from '../types'

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
const editForm = reactive({ name: '', murabbi: '', level_id: '', status: 'ACTIVE' })

const candidateSearch = ref('')
const candidates = ref<CadreProfile[]>([])
const searching = ref(false)

const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')
const confirmMessage = ref('')
let confirmAction: (() => Promise<void>) | null = null

const canUpdate = computed(() => auth.can('kaderisasi:update'))
const group = computed(() => detail.value?.group ?? null)

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
  editForm.murabbi = g.murabbi
  editForm.level_id = g.level_id ?? ''
  editForm.status = g.status
  editing.value = true
}

function saveEdit() {
  if (!editForm.name.trim() || !editForm.murabbi.trim() || !editForm.level_id) {
    notify('Field berikut wajib diisi: Nama Grup, Murabbi, Jenjang.')
    return
  }
  void run(async () => {
    await kaderisasiApi.updateGroup(id, {
      name: editForm.name,
      murabbi: editForm.murabbi,
      level_id: editForm.level_id,
      status: editForm.status,
    })
    editing.value = false
  })
}

const memberIds = computed(() => new Set((detail.value?.members ?? []).map((m) => m.cadre_profile_id)))

async function searchCandidates() {
  searching.value = true
  error.value = null
  try {
    const res = await cadreApi.list({ search: candidateSearch.value || undefined, pageSize: 10 })
    candidates.value = res.data
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal mencari kader', 'Gagal')
  } finally {
    searching.value = false
  }
}

function addMember(cadreProfileId: string) {
  void run(() => kaderisasiApi.addMember(id, cadreProfileId))
}

function removeMember(memberId: string) {
  askConfirm('Hapus peserta ini dari grup?', () => run(() => kaderisasiApi.removeMember(id, memberId)))
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
      <header class="mb-6">
        <router-link to="/kaderisasi/grup-pembinaan" class="text-sm text-brand-600 hover:underline">← Grup Pembinaan</router-link>
        <h1 class="text-xl font-semibold text-slate-900">{{ group.name }}</h1>
      </header>

      <dl class="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div><dt class="text-slate-500">Nama</dt><dd class="text-slate-900">{{ group.name }}</dd></div>
        <div><dt class="text-slate-500">Murabbi</dt><dd class="text-slate-900">{{ group.murabbi }}</dd></div>
        <div><dt class="text-slate-500">Jenjang</dt><dd class="text-slate-900">{{ group.level_name || '—' }}</dd></div>
        <div><dt class="text-slate-500">Status</dt><dd class="text-slate-900">{{ groupStatusLabel(group.status) }}</dd></div>
      </dl>

      <div class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Peserta ({{ detail.members.length }})</h2>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-slate-500">
                <th class="py-2 pr-4">Kader</th>
                <th class="py-2 pr-4">Jenjang</th>
                <th class="py-2 pr-4">Status</th>
                <th class="py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in detail.members" :key="m.id" class="border-b border-slate-100">
                <td class="py-2 pr-4 text-slate-900">{{ m.person_code }} - {{ m.full_name }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ m.level_name }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ m.status }}</td>
                <td class="py-2 text-right">
                  <button v-if="canUpdate" type="button" class="text-xs text-red-600 hover:underline" @click="removeMember(m.id)">Hapus</button>
                </td>
              </tr>
              <tr v-if="detail.members.length === 0"><td colspan="4" class="py-3 text-slate-500">Belum ada peserta.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="canUpdate" class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Tambah Peserta</h2>
        <div class="mb-3 flex flex-wrap gap-2">
          <input v-model="candidateSearch" placeholder="Cari kader (nama atau nomor anggota)" class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-72" @keyup.enter="searchCandidates" />
          <button type="button" :disabled="searching" class="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50" @click="searchCandidates">Cari</button>
        </div>
        <ul class="space-y-1 text-sm">
          <li v-for="c in candidates" :key="c.id" class="flex items-center justify-between rounded border border-slate-100 p-2">
            <span class="text-slate-700">{{ c.person_code }} - {{ c.full_name }} <span class="text-xs text-slate-500">({{ c.level_name }})</span></span>
            <button
              type="button"
              :disabled="saving || memberIds.has(c.id)"
              class="rounded bg-brand-500 px-2 py-1 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              @click="addMember(c.id)"
            >
              {{ memberIds.has(c.id) ? 'Tergabung' : 'Tambah' }}
            </button>
          </li>
        </ul>
      </div>

      <div v-if="canUpdate" class="mb-6 flex gap-2">
        <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editing ? (editing = false) : startEdit()">
          {{ editing ? 'Batal' : 'Edit' }}
        </button>
        <button type="button" class="rounded border border-red-300 px-3 py-2 text-sm text-red-600" @click="removeGroup">Hapus</button>
      </div>

      <form v-if="editing" class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="saveEdit">
        <input v-model="editForm.name" placeholder="Nama Grup" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input v-model="editForm.murabbi" placeholder="Murabbi" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <select v-model="editForm.level_id" class="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Jenjang</option>
          <option v-for="l in levels" :key="l.id" :value="l.id">{{ l.name }}</option>
        </select>
        <select v-model="editForm.status" class="rounded border border-slate-300 px-3 py-2 text-sm">
          <option v-for="s in GROUP_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
        <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">Simpan</button>
      </form>
    </template>

    <AppModal :open="modalMessage !== ''" :title="modalTitle" :message="modalMessage" @close="modalMessage = ''" />
    <AppModal :open="confirmMessage !== ''" variant="confirm" title="Konfirmasi" :message="confirmMessage" @close="confirmMessage = ''" @confirm="runConfirm" />
  </section>
</template>
