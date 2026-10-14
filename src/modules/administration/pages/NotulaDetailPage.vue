<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppModal from '@/components/AppModal.vue'
import FileDropzone from '@/components/FileDropzone.vue'
import { useAuthStore } from '@/app/stores/auth'
import { downloadFile } from '@/services/http'
import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { correspondenceApi } from '../api'
import { truncateFilename, type Notula } from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const id = route.params.id as string

const notula = ref<Notula | null>(null)
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const editing = ref(false)
const saving = ref(false)
const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')
const confirmMessage = ref('')
let confirmAction: (() => Promise<void>) | null = null

const form = reactive({ organization_unit_id: '', meeting_at: '' })
const file = ref<File | null>(null)

const canUpdate = computed(() => auth.can('correspondence:update'))

function toLocalInput(value: string): string {
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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
    notula.value = await correspondenceApi.getNotula(id)
    form.organization_unit_id = notula.value.organization_unit_id
    form.meeting_at = toLocalInput(notula.value.meeting_at)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat notula'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await load()
  try {
    const res = await organizationApi.listUnits({ pageSize: 200 })
    units.value = res.data
  } catch {
    units.value = []
  }
})

async function save() {
  if (!form.organization_unit_id || !form.meeting_at) {
    notify('Unit dan Waktu Rapat wajib diisi.')
    return
  }
  saving.value = true
  try {
    let fileId = notula.value!.file_id
    if (file.value) {
      const uploaded = await correspondenceApi.upload('notula', file.value)
      fileId = uploaded.file_id
    }
    await correspondenceApi.updateNotula(id, {
      organization_unit_id: form.organization_unit_id,
      meeting_at: new Date(form.meeting_at).toISOString(),
      file_id: fileId,
    })
    file.value = null
    editing.value = false
    await load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal menyimpan notula', 'Gagal')
  } finally {
    saving.value = false
  }
}

function remove() {
  askConfirm('Hapus notula ini?', async () => {
    try {
      await correspondenceApi.deleteNotula(id)
      await router.push('/administration/notulae')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal menghapus notula', 'Gagal')
    }
  })
}

function download() {
  if (notula.value) void downloadFile(`/api/v1/files/${notula.value.file_id}`, notula.value.file_name ?? 'notula')
}

function meetingLabel(): string {
  if (!notula.value) return '—'
  return new Date(notula.value.meeting_at).toLocaleString('id-ID')
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="notula">
      <header class="mb-6">
        <router-link to="/administration/notulae" class="text-sm text-brand-600 hover:underline">← Notula Rapat</router-link>
        <h1 class="text-xl font-semibold text-slate-900">{{ notula.unit_name || 'Notula Rapat' }}</h1>
      </header>

      <dl class="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div><dt class="text-slate-500">Unit</dt><dd class="text-slate-900">{{ notula.unit_name || '—' }}</dd></div>
        <div><dt class="text-slate-500">Waktu Rapat</dt><dd class="text-slate-900">{{ meetingLabel() }}</dd></div>
        <div class="sm:col-span-2">
          <dt class="text-slate-500">Notula</dt>
          <dd><button type="button" class="text-brand-600 hover:underline" @click="download">{{ truncateFilename(notula.file_name) || 'Unduh' }}</button></dd>
        </div>
      </dl>

      <div v-if="canUpdate" class="mb-6 flex gap-2">
        <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editing = !editing">
          {{ editing ? 'Batal' : 'Edit' }}
        </button>
        <button type="button" class="rounded border border-red-300 px-3 py-2 text-sm text-red-600" @click="remove">Hapus</button>
      </div>

      <form v-if="editing" class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="save">
        <select v-model="form.organization_unit_id" class="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Unit</option>
          <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
        <input v-model="form.meeting_at" type="datetime-local" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <div class="sm:col-span-2">
          <FileDropzone label="Ganti berkas notula (opsional)" @update:file="file = $event" />
        </div>
        <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">
          Simpan
        </button>
      </form>
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
