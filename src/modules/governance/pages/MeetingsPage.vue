<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import Pagination from '@/components/Pagination.vue'
import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { meetingsApi } from '../api'
import type { Meeting, PageMeta } from '../types'

const meetings = ref<Meeting[]>([])
const meta = ref<PageMeta | null>(null)
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const page = ref(1)

const form = reactive({ organization_unit_id: '', title: '', meeting_type: '', start_at: '', location: '' })

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, unitList] = await Promise.all([
      meetingsApi.list({ page: page.value }),
      organizationApi.listUnits({ pageSize: 200 }),
    ])
    meetings.value = list.data
    meta.value = list.meta ?? null
    units.value = unitList.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat rapat'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onPageChange(target: number) {
  page.value = target
  void load()
}

async function submit() {
  submitting.value = true
  error.value = null
  try {
    await meetingsApi.create({
      organization_unit_id: form.organization_unit_id,
      title: form.title,
      meeting_type: form.meeting_type || undefined,
      start_at: form.start_at ? new Date(form.start_at).toISOString() : undefined,
      location: form.location || undefined,
    })
    showForm.value = false
    form.title = ''
    form.meeting_type = ''
    form.start_at = ''
    form.location = ''
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan rapat'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Rapat</h1>
        <p class="text-sm text-slate-500">{{ meta?.total ?? meetings.length }} rapat</p>
      </div>
      <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
        {{ showForm ? 'Batal' : 'Tambah Rapat' }}
      </button>
    </header>

    <form v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="submit">
      <select v-model="form.organization_unit_id" required class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="" disabled>Unit organisasi</option>
        <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
      <input v-model="form.title" placeholder="Judul rapat" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.meeting_type" placeholder="Jenis (mis. RUTIN)" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.start_at" type="datetime-local" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.location" placeholder="Lokasi" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
      <button type="submit" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="meetings.length === 0" class="text-sm text-slate-500">Belum ada rapat.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Judul</th>
            <th class="py-2 pr-4">Jenis</th>
            <th class="py-2 pr-4">Waktu</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in meetings" :key="m.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4">
              <router-link :to="`/meetings/${m.id}`" class="text-brand-600 hover:underline">{{ m.title }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ m.meeting_type || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ m.start_at ? new Date(m.start_at).toLocaleString('id-ID') : '—' }}</td>
            <td class="py-2 text-slate-600">{{ m.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" />
  </section>
</template>
