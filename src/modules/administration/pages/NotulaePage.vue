<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import AppModal from '@/components/AppModal.vue'
import FileDropzone from '@/components/FileDropzone.vue'
import Pagination from '@/components/Pagination.vue'
import { useAuthStore } from '@/app/stores/auth'
import { downloadFile } from '@/services/http'
import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { correspondenceApi } from '../api'
import { truncateFilename, type Notula, type PageMeta } from '../types'

const auth = useAuthStore()
const canCreate = auth.can('correspondence:create')

const notulae = ref<Notula[]>([])
const meta = ref<PageMeta | null>(null)
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const modalMessage = ref('')
const page = ref(1)
const pageSize = ref(10)

const form = reactive({ organization_unit_id: '', meeting_at: '' })
const file = ref<File | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, unitList] = await Promise.all([
      correspondenceApi.notulae(page.value, pageSize.value),
      organizationApi.listUnits({ pageSize: 200 }),
    ])
    notulae.value = list.data
    meta.value = list.meta ?? null
    units.value = unitList.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat notula'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onPageChange(target: number) {
  page.value = target
  void load()
}

function onPageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  void load()
}

async function submit() {
  const missing: string[] = []
  if (!form.organization_unit_id) missing.push('Unit')
  if (!form.meeting_at) missing.push('Waktu Rapat')
  if (!file.value) missing.push('Notula Rapat')
  if (missing.length > 0) {
    modalMessage.value = `Field berikut wajib diisi: ${missing.join(', ')}.`
    return
  }
  submitting.value = true
  error.value = null
  try {
    const uploaded = await correspondenceApi.upload('notula', file.value!)
    await correspondenceApi.createNotula({
      organization_unit_id: form.organization_unit_id,
      meeting_at: new Date(form.meeting_at).toISOString(),
      file_id: uploaded.file_id,
    })
    showForm.value = false
    form.organization_unit_id = ''
    form.meeting_at = ''
    file.value = null
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan notula'
  } finally {
    submitting.value = false
  }
}

function download(n: Notula) {
  void downloadFile(`/api/v1/files/${n.file_id}`, n.file_name ?? 'notula')
}

function meetingLabel(n: Notula): string {
  return new Date(n.meeting_at).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Notula Rapat</h1>
        <p class="text-sm text-slate-500">{{ meta?.total ?? notulae.length }} notula</p>
      </div>
      <button
        v-if="canCreate"
        type="button"
        class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Batal' : 'Tambah Notula' }}
      </button>
    </header>

    <form v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="submit">
      <select v-model="form.organization_unit_id" class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="" disabled>Unit</option>
        <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
      <input v-model="form.meeting_at" type="datetime-local" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <div class="sm:col-span-2">
        <FileDropzone label="Unggah berkas notula" @update:file="file = $event" />
      </div>
      <button type="submit" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="notulae.length === 0" class="text-sm text-slate-500">Belum ada notula.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Unit</th>
            <th class="py-2 pr-4">Waktu Rapat</th>
            <th class="py-2">Notula Rapat</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in notulae" :key="n.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4">
              <router-link :to="`/administration/notulae/${n.id}`" class="text-brand-600 hover:underline">
                {{ n.unit_name || '—' }}
              </router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ meetingLabel(n) }}</td>
            <td class="py-2">
              <button type="button" class="text-brand-600 hover:underline" :title="n.file_name ?? ''" @click="download(n)">
                {{ truncateFilename(n.file_name) || 'Unduh' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
    <AppModal :open="modalMessage !== ''" title="Pemberitahuan" :message="modalMessage" @close="modalMessage = ''" />
  </section>
</template>
