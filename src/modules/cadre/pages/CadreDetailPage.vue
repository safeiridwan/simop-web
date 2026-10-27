<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AppModal from '@/components/AppModal.vue'
import PersonIdentitySection from '@/components/PersonIdentitySection.vue'
import { useAuthStore } from '@/app/stores/auth'
import {
  emptyIdentityForm,
  formFromPerson,
  toPersonPayload,
  usePersonIdentity,
  type PersonIdentityForm,
} from '@/composables/usePersonIdentity'
import { peopleApi } from '@/modules/people/api'
import { cadreApi } from '../api'
import { CADRE_STATUSES, type CadreHistoryEntry, type CadreLevel, type CadreProfile } from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const id = route.params.id as string

const profile = ref<CadreProfile | null>(null)
const levels = ref<CadreLevel[]>([])
const history = ref<CadreHistoryEntry[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const identity = usePersonIdentity(() => profile.value?.person_id ?? '')

const editing = ref(false)
const form = reactive<PersonIdentityForm>(emptyIdentityForm())
let baseline = ''
const discardOpen = ref(false)
let pendingNavigation: string | null = null
const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')
const confirmMessage = ref('')
let confirmAction: (() => Promise<void>) | null = null

const promoteForm = reactive({ to_level_id: '', effective_date: '', notes: '' })
const statusForm = reactive({ status: '', notes: '' })

const editingHistoryId = ref<string | null>(null)
const historyForm = reactive({ from_level_id: '', to_level_id: '', effective_date: '', notes: '' })

const levelName = (levelId: string | null) => levels.value.find((l) => l.id === levelId)?.name ?? '—'
const promotableLevels = computed(() => levels.value.filter((l) => l.id !== profile.value?.current_level_id))
const canUpdate = computed(() => auth.can('cadre:update'))
const dirty = computed(() => editing.value && JSON.stringify(form) !== baseline)

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

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const [p, levelList, h] = await Promise.all([cadreApi.get(id), cadreApi.levels(), cadreApi.history(id)])
    profile.value = p
    levels.value = levelList
    history.value = h
    statusForm.status = p.status
    await identity.load()
    Object.assign(form, formFromPerson(identity.person.value, identity.address.value))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat kader'
  } finally {
    loading.value = false
  }
}

onMounted(refresh)

function startEdit() {
  Object.assign(form, formFromPerson(identity.person.value, identity.address.value))
  baseline = JSON.stringify(form)
  editing.value = true
}

function cancelEdit() {
  Object.assign(form, formFromPerson(identity.person.value, identity.address.value))
  editing.value = false
}

async function saveIdentity() {
  if (!form.full_name.trim()) {
    notify('Nama Lengkap wajib diisi.', 'Data Belum Lengkap')
    return
  }
  saving.value = true
  error.value = null
  try {
    await peopleApi.update(profile.value!.person_id, toPersonPayload(form))
    editing.value = false
    await refresh()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal menyimpan identitas', 'Gagal Menyimpan')
  } finally {
    saving.value = false
  }
}

function removeCadre() {
  askConfirm('Hapus kader ini? Data dapat dipulihkan oleh administrator.', async () => {
    try {
      await cadreApi.remove(id)
      editing.value = false
      await router.push('/cadres')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal menghapus kader', 'Gagal Menghapus')
    }
  })
}

async function promote() {
  saving.value = true
  error.value = null
  try {
    await cadreApi.promote(id, {
      to_level_id: promoteForm.to_level_id,
      effective_date: promoteForm.effective_date || undefined,
      notes: promoteForm.notes || undefined,
    })
    promoteForm.to_level_id = ''
    promoteForm.effective_date = ''
    promoteForm.notes = ''
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal mempromosikan'
  } finally {
    saving.value = false
  }
}

async function updateStatus() {
  saving.value = true
  error.value = null
  try {
    await cadreApi.updateStatus(id, statusForm.status, statusForm.notes || undefined)
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal mengubah status'
  } finally {
    saving.value = false
  }
}

function startEditHistory(h: CadreHistoryEntry) {
  editingHistoryId.value = h.id
  historyForm.from_level_id = h.from_level_id ?? ''
  historyForm.to_level_id = h.to_level_id
  historyForm.effective_date = h.effective_date ?? ''
  historyForm.notes = h.notes ?? ''
}

function cancelEditHistory() {
  editingHistoryId.value = null
}

async function saveHistory() {
  if (!editingHistoryId.value) return
  saving.value = true
  error.value = null
  try {
    await cadreApi.updateHistory(id, editingHistoryId.value, {
      from_level_id: historyForm.from_level_id || null,
      to_level_id: historyForm.to_level_id,
      effective_date: historyForm.effective_date || undefined,
      notes: historyForm.notes || undefined,
    })
    editingHistoryId.value = null
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan riwayat'
  } finally {
    saving.value = false
  }
}

async function removeHistory(h: CadreHistoryEntry) {
  if (!window.confirm('Hapus baris riwayat ini?')) return
  saving.value = true
  error.value = null
  try {
    await cadreApi.deleteHistory(id, h.id)
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menghapus riwayat'
  } finally {
    saving.value = false
  }
}

async function addDocument(file: File, documentType: string, documentNumber: string) {
  try {
    await identity.addDocument(file, documentType, documentNumber)
    notify('Dokumen berhasil ditambahkan.')
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal menambah dokumen', 'Gagal Menyimpan')
  }
}

async function removeDocument(documentId: string) {
  try {
    await identity.removeDocument(documentId)
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal menghapus dokumen', 'Gagal Menghapus')
  }
}

function beforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

watch(dirty, (value) => {
  if (value) window.addEventListener('beforeunload', beforeUnload)
  else window.removeEventListener('beforeunload', beforeUnload)
})

onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

onBeforeRouteLeave((to) => {
  if (!dirty.value) return true
  discardOpen.value = true
  pendingNavigation = to.fullPath
  return false
})

function keepEditing() {
  discardOpen.value = false
  pendingNavigation = null
}

function discardChanges() {
  discardOpen.value = false
  editing.value = false
  const target = pendingNavigation
  pendingNavigation = null
  if (target) void router.push(target)
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="profile">
      <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <AppBreadcrumb :items="[{ label: 'Kader', to: '/cadres' }, { label: 'Detail Kader' }]" />
          <h1 class="text-xl font-semibold text-slate-900">{{ profile.full_name }}</h1>
          <p class="font-mono text-xs text-slate-500">{{ profile.person_code }}</p>
          <p class="mt-1 text-sm text-slate-600">
            Jenjang saat ini: <strong>{{ profile.level_name }}</strong> · {{ profile.status }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <template v-if="canUpdate && !editing">
            <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="startEdit">Edit</button>
            <button type="button" class="rounded border border-red-300 px-3 py-2 text-sm text-red-600" @click="removeCadre">Hapus</button>
          </template>
          <template v-if="editing">
            <button type="button" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="saveIdentity">
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
            <button type="button" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="cancelEdit">Batal</button>
          </template>
        </div>
      </header>

      <PersonIdentitySection
        :form="form"
        :person="identity.person.value"
        :address="identity.address.value"
        :documents="identity.documents.value"
        :editing="editing"
        :disabled="saving"
        class="mb-6"
        @add-document="addDocument"
        @remove-document="removeDocument"
      />

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Promosi Jenjang</h2>
          <p class="mb-3 text-xs text-slate-500">Promosi mengikuti urutan jenjang kecuali kebijakan mengizinkan lompatan.</p>
          <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="promote">
            <div>
              <label class="block text-sm font-medium text-slate-700" for="pr-level">Jenjang Tujuan</label>
              <select id="pr-level" v-model="promoteForm.to_level_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
                <option value="" disabled>Pilih jenjang</option>
                <option v-for="l in promotableLevels" :key="l.id" :value="l.id">{{ l.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700" for="pr-date">Tanggal Efektif</label>
              <input id="pr-date" v-model="promoteForm.effective_date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div class="sm:col-span-2">
              <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
                Promosikan
              </button>
            </div>
          </form>

          <h2 class="mb-3 mt-6 font-semibold text-slate-900">Ubah Status</h2>
          <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="updateStatus">
            <div>
              <label class="block text-sm font-medium text-slate-700" for="c-status">Status</label>
              <select id="c-status" v-model="statusForm.status" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
                <option v-for="s in CADRE_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700" for="c-notes">Catatan</label>
              <input id="c-notes" v-model="statusForm.notes" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div class="sm:col-span-2">
              <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">
                Simpan Status
              </button>
            </div>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Riwayat Jenjang</h2>
          <ol class="space-y-3 text-sm">
            <li v-for="h in history" :key="h.id" class="border-l-2 border-brand-200 pl-3">
              <template v-if="editingHistoryId === h.id">
                <div class="grid gap-2 sm:grid-cols-2">
                  <label class="flex flex-col text-slate-600">
                    Dari
                    <select v-model="historyForm.from_level_id" class="mt-1 rounded border border-slate-300 px-3 py-2 text-sm">
                      <option value="">— Tanpa jenjang awal —</option>
                      <option v-for="l in levels" :key="l.id" :value="l.id">{{ l.name }}</option>
                    </select>
                  </label>
                  <label class="flex flex-col text-slate-600">
                    Ke
                    <select v-model="historyForm.to_level_id" class="mt-1 rounded border border-slate-300 px-3 py-2 text-sm">
                      <option v-for="l in levels" :key="l.id" :value="l.id">{{ l.name }}</option>
                    </select>
                  </label>
                  <label class="flex flex-col text-slate-600">
                    Tanggal Efektif
                    <input v-model="historyForm.effective_date" type="date" class="mt-1 rounded border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label class="flex flex-col text-slate-600">
                    Catatan
                    <input v-model="historyForm.notes" class="mt-1 rounded border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                </div>
                <div class="mt-2 flex gap-2">
                  <button type="button" :disabled="saving" class="rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="saveHistory">
                    Simpan
                  </button>
                  <button type="button" class="rounded border border-slate-300 px-3 py-1.5 text-sm" @click="cancelEditHistory">Batal</button>
                </div>
              </template>
              <template v-else>
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-slate-900">
                      {{ h.from_level_id ? levelName(h.from_level_id) + ' → ' : '' }}{{ levelName(h.to_level_id) }}
                    </p>
                    <p class="text-xs text-slate-500">
                      {{ h.effective_date || new Date(h.created_at).toLocaleDateString('id-ID') }}
                      <span v-if="h.notes"> · {{ h.notes }}</span>
                    </p>
                  </div>
                  <div class="flex shrink-0 gap-2">
                    <button type="button" class="text-xs text-brand-600 hover:underline" @click="startEditHistory(h)">Ubah</button>
                    <button type="button" :disabled="saving" class="text-xs text-red-600 hover:underline disabled:opacity-50" @click="removeHistory(h)">Hapus</button>
                  </div>
                </div>
              </template>
            </li>
            <li v-if="history.length === 0" class="text-slate-500">Belum ada riwayat.</li>
          </ol>
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
    <AppModal
      :open="discardOpen"
      variant="confirm"
      title="Perubahan Belum Tersimpan"
      message="Perubahan belum disimpan. Yakin ingin meninggalkan halaman ini?"
      confirm-label="Ya, Tinggalkan"
      @close="keepEditing"
      @confirm="discardChanges"
    />
  </section>
</template>
