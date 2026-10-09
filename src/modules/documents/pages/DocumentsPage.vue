<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { documentsApi } from '../api'
import type { Document } from '../types'

const router = useRouter()
const route = useRoute()
const documents = ref<Document[]>([])
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const selectedFile = ref<File | null>(null)

const form = reactive({ organization_unit_id: '', document_type: '', document_number: '', title: '', document_date: '' })
const search = ref('')
const typeFilter = ref(typeof route.query.type === 'string' ? route.query.type : '')

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, unitList] = await Promise.all([
      documentsApi.list({ search: search.value, documentType: typeFilter.value }),
      organizationApi.listUnits({ pageSize: 200 }),
    ])
    documents.value = list.data
    units.value = unitList.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat dokumen'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

async function submit() {
  submitting.value = true
  error.value = null
  try {
    let fileId: string | undefined
    if (selectedFile.value) {
      const uploaded = await documentsApi.upload(selectedFile.value)
      fileId = uploaded.id
    }
    const created = await documentsApi.create({
      organization_unit_id: form.organization_unit_id,
      document_type: form.document_type,
      document_number: form.document_number || undefined,
      title: form.title,
      document_date: form.document_date || undefined,
      file_id: fileId,
    })
    await router.push(`/documents/${created.id}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan dokumen'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Dokumen</h1>
        <p class="text-sm text-slate-500">{{ documents.length }} dokumen</p>
      </div>
      <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
        {{ showForm ? 'Batal' : 'Tambah Dokumen' }}
      </button>
    </header>

    <form v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="submit">
      <select v-model="form.organization_unit_id" required class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="" disabled>Unit organisasi</option>
        <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
      <input v-model="form.document_type" placeholder="Jenis dokumen (mis. SK)" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.document_number" placeholder="Nomor dokumen" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.document_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.title" placeholder="Judul" required class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
      <input type="file" class="text-sm sm:col-span-2" @change="onFile" />
      <button type="submit" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <div class="mb-4 flex flex-wrap gap-2">
      <input v-model="search" placeholder="Cari judul atau nomor" class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64" @keyup.enter="load" />
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="load">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="documents.length === 0" class="text-sm text-slate-500">Belum ada dokumen.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Judul</th>
            <th class="py-2 pr-4">Jenis</th>
            <th class="py-2 pr-4">Nomor</th>
            <th class="py-2 pr-4">Ver</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in documents" :key="doc.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4">
              <router-link :to="`/documents/${doc.id}`" class="text-brand-600 hover:underline">{{ doc.title }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ doc.document_type }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ doc.document_number || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ doc.version }}</td>
            <td class="py-2 text-slate-600">{{ doc.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
