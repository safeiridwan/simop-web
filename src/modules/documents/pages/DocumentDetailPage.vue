<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useAuthStore } from '@/app/stores/auth'
import { downloadFile } from '@/services/http'
import { rolesApi } from '@/modules/roles/api'
import type { Role } from '@/modules/roles/types'
import { documentsApi } from '../api'
import { ACCESS_PERMISSIONS, DOCUMENT_STATUSES, type Document, type DocumentAccess, type DocumentVersion } from '../types'

const route = useRoute()
const auth = useAuthStore()
const id = route.params.id as string

const doc = ref<Document | null>(null)
const versions = ref<DocumentVersion[]>([])
const access = ref<DocumentAccess[]>([])
const roles = ref<Role[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const statusForm = reactive({ status: '' })
const versionFile = ref<File | null>(null)
const accessForm = reactive({ role_id: '', permission: 'READ' })

const fileNames = ref<Record<string, string>>({})

async function load() {
  loading.value = true
  error.value = null
  try {
    const [d, v, a, roleList] = await Promise.all([
      documentsApi.get(id),
      documentsApi.versions(id),
      documentsApi.access(id),
      rolesApi.list(),
    ])
    doc.value = d
    versions.value = v
    access.value = a
    roles.value = roleList
    statusForm.status = d.status
    await loadFileNames(v)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat dokumen'
  } finally {
    loading.value = false
  }
}

async function loadFileNames(list: DocumentVersion[]) {
  if (!doc.value?.file_id) return
  // Best-effort: filenames are only needed for download labels; the API serves
  // the file by id regardless, so we display the id when unknown.
  for (const v of list) {
    if (v.file_id) fileNames.value[v.file_id] = `berkas v${v.version_number}`
  }
  fileNames.value[doc.value.file_id] = `berkas v${doc.value.version}`
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

function download(fileId: string) {
  void downloadFile(`/api/v1/files/${fileId}`, fileNames.value[fileId] ?? `dokumen-${fileId.slice(0, 8)}`)
}

function onVersionFile(event: Event) {
  versionFile.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

function addVersion() {
  if (!versionFile.value) {
    error.value = 'Pilih berkas terlebih dahulu.'
    return
  }
  void run(async () => {
    const uploaded = await documentsApi.upload(versionFile.value!)
    await documentsApi.addVersion(id, uploaded.id)
    versionFile.value = null
  })
}

function updateStatus() {
  void run(() => documentsApi.update(id, { status: statusForm.status }))
}

function addAccess() {
  void run(async () => {
    await documentsApi.addAccess(id, accessForm.role_id, accessForm.permission)
    accessForm.role_id = ''
    accessForm.permission = 'READ'
  })
}

function removeAccess(accessId: string) {
  void run(() => documentsApi.removeAccess(id, accessId))
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="doc">
      <header class="mb-6">
        <router-link to="/documents" class="text-sm text-brand-600 hover:underline">← Dokumen</router-link>
        <h1 class="text-xl font-semibold text-slate-900">{{ doc.title }}</h1>
        <p class="text-sm text-slate-500">{{ doc.document_type }} · {{ doc.document_number || '—' }} · v{{ doc.version }} · {{ doc.status }}</p>
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Status</h2>
          <form class="flex flex-wrap items-end gap-2" @submit.prevent="updateStatus">
            <select v-model="statusForm.status" class="rounded border border-slate-300 px-3 py-2 text-sm">
              <option v-for="s in DOCUMENT_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Simpan</button>
          </form>

          <h2 class="mb-3 mt-6 font-semibold text-slate-900">Berkas Saat Ini</h2>
          <button
            v-if="doc.file_id"
            type="button"
            class="text-sm text-brand-600 hover:underline"
            @click="download(doc.file_id)"
          >
            Unduh berkas v{{ doc.version }}
          </button>
          <p v-else class="text-sm text-slate-500">Belum ada berkas.</p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Versi</h2>
          <ul class="mb-3 space-y-1 text-sm">
            <li v-for="v in versions" :key="v.id" class="flex items-center justify-between gap-2">
              <span class="text-slate-900">v{{ v.version_number }}</span>
              <span class="text-xs text-slate-500">{{ new Date(v.uploaded_at).toLocaleDateString('id-ID') }}</span>
              <button v-if="v.file_id" type="button" class="text-xs text-brand-600 hover:underline" @click="download(v.file_id)">Unduh</button>
            </li>
            <li v-if="versions.length === 0" class="text-slate-500">Belum ada versi tambahan.</li>
          </ul>
          <form class="grid gap-2" @submit.prevent="addVersion">
            <input type="file" class="text-sm" @change="onVersionFile" />
            <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:w-fit">
              Unggah Versi Baru
            </button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
          <h2 class="mb-3 font-semibold text-slate-900">Akses</h2>
          <ul class="mb-3 space-y-1 text-sm">
            <li v-for="a in access" :key="a.id" class="flex items-center justify-between gap-2">
              <span class="text-slate-900">{{ a.role_code }} <span class="text-xs text-slate-500">{{ a.permission }}</span></span>
              <button
                v-if="auth.can('documents:update')"
                type="button"
                :disabled="saving"
                class="text-xs text-red-600 hover:underline"
                @click="removeAccess(a.id)"
              >
                Hapus
              </button>
            </li>
            <li v-if="access.length === 0" class="text-slate-500">Semua pengguna dengan izin dokumen dapat mengakses.</li>
          </ul>
          <form v-if="auth.can('documents:update')" class="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" @submit.prevent="addAccess">
            <select v-model="accessForm.role_id" required class="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="" disabled>Peran</option>
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
            <select v-model="accessForm.permission" class="rounded border border-slate-300 px-3 py-2 text-sm">
              <option v-for="p in ACCESS_PERMISSIONS" :key="p.value" :value="p.value">{{ p.label }}</option>
            </select>
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Tambah</button>
          </form>
        </div>
      </div>
    </template>
  </section>
</template>
