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
import { formatDate } from '@/utils/date'
import { affiliationsApi } from '../api'
import {
  AFFILIATION_STATUSES,
  AFFILIATION_TYPES,
  affiliationTypeLabel,
  type Affiliation,
} from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const id = route.params.id as string

const affiliation = ref<Affiliation | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const identity = usePersonIdentity(() => affiliation.value?.person_id ?? '')

const editing = ref(false)
const form = reactive<PersonIdentityForm>(emptyIdentityForm())
const menu = reactive({ affiliation_type: '', end_date: '', status: 'ACTIVE', source: '', notes: '' })
let baseline = ''
const discardOpen = ref(false)
let pendingNavigation: string | null = null
const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')
const confirmMessage = ref('')
let confirmAction: (() => Promise<void>) | null = null

const canUpdate = computed(() => auth.can('members:update'))
const dirty = computed(() => editing.value && JSON.stringify([form, menu]) !== baseline)

function statusLabel(status: string): string {
  return AFFILIATION_STATUSES.find((s) => s.value === status)?.label ?? status
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

function fillMenu() {
  const a = affiliation.value
  menu.affiliation_type = a?.affiliation_type ?? AFFILIATION_TYPES[0].value
  menu.end_date = a?.end_date ?? ''
  menu.status = a?.status ?? 'ACTIVE'
  menu.source = a?.source ?? ''
  menu.notes = a?.notes ?? ''
}

async function refresh() {
  loading.value = true
  error.value = null
  try {
    affiliation.value = await affiliationsApi.get(id)
    await identity.load()
    fillMenu()
    Object.assign(form, formFromPerson(identity.person.value, identity.address.value))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat non-kader'
  } finally {
    loading.value = false
  }
}

onMounted(refresh)

function startEdit() {
  Object.assign(form, formFromPerson(identity.person.value, identity.address.value))
  fillMenu()
  baseline = JSON.stringify([form, menu])
  editing.value = true
}

function cancelEdit() {
  Object.assign(form, formFromPerson(identity.person.value, identity.address.value))
  fillMenu()
  editing.value = false
}

async function save() {
  if (!form.full_name.trim()) {
    notify('Nama Lengkap wajib diisi.', 'Data Belum Lengkap')
    return
  }
  if (!menu.affiliation_type) {
    notify('Jenis wajib dipilih.', 'Data Belum Lengkap')
    return
  }
  saving.value = true
  error.value = null
  try {
    await affiliationsApi.update(id, {
      affiliation_type: menu.affiliation_type,
      end_date: menu.end_date || undefined,
      status: menu.status,
      source: menu.source || undefined,
      notes: menu.notes || undefined,
      person: toPersonPayload(form),
    })
    editing.value = false
    await refresh()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal menyimpan non-kader', 'Gagal Menyimpan')
  } finally {
    saving.value = false
  }
}

function remove() {
  askConfirm('Hapus data non-kader ini? Data dapat dipulihkan oleh administrator.', async () => {
    try {
      await affiliationsApi.remove(id)
      editing.value = false
      await router.push('/non-party')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal menghapus non-kader', 'Gagal Menghapus')
    }
  })
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

    <template v-else-if="affiliation">
      <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <AppBreadcrumb :items="[{ label: 'Non-Kader', to: '/non-party' }, { label: 'Detail Non-Kader' }]" />
          <h1 class="text-xl font-semibold text-slate-900">{{ affiliation.full_name }}</h1>
          <p class="font-mono text-xs text-slate-500">{{ affiliation.person_code }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <template v-if="canUpdate && !editing">
            <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="startEdit">Edit</button>
            <button type="button" class="rounded border border-red-300 px-3 py-2 text-sm text-red-600" @click="remove">Hapus</button>
          </template>
          <template v-if="editing">
            <button type="button" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="save">
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

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Data Non-Kader</h2>

        <dl v-if="!editing" class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div><dt class="text-slate-500">Jenis</dt><dd class="text-slate-900">{{ affiliationTypeLabel(affiliation.affiliation_type) }}</dd></div>
          <div><dt class="text-slate-500">Sumber</dt><dd class="text-slate-900">{{ affiliation.source || '—' }}</dd></div>
          <div><dt class="text-slate-500">Selesai</dt><dd class="text-slate-900">{{ affiliation.end_date ? formatDate(affiliation.end_date) : '—' }}</dd></div>
          <div><dt class="text-slate-500">Status</dt><dd class="text-slate-900">{{ statusLabel(affiliation.status) }}</dd></div>
          <div class="sm:col-span-2"><dt class="text-slate-500">Catatan</dt><dd class="text-slate-900">{{ affiliation.notes || '—' }}</dd></div>
        </dl>

        <form v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2" @submit.prevent="save">
          <div>
            <label class="block text-sm font-medium text-slate-700" for="np-type">Jenis</label>
            <select id="np-type" v-model="menu.affiliation_type" :disabled="saving" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option v-for="t in AFFILIATION_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="np-status">Status</label>
            <select id="np-status" v-model="menu.status" :disabled="saving" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option v-for="s in AFFILIATION_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="np-source">Sumber</label>
            <input id="np-source" v-model="menu.source" :disabled="saving" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="np-end">Selesai</label>
            <input id="np-end" v-model="menu.end_date" type="date" :disabled="saving" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-700" for="np-notes">Catatan</label>
            <input id="np-notes" v-model="menu.notes" :disabled="saving" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </form>
      </section>
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
