<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { programsApi } from '../api'
import { PROGRAM_STATUSES, programStatusLabel, type Program } from '../types'

const programs = ref<Program[]>([])
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const showForm = ref(false)
const submitting = ref(false)
const search = ref('')
const statusFilter = ref('')

const form = reactive({ organization_unit_id: '', name: '', objective: '', start_date: '', end_date: '' })

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, unitList] = await Promise.all([
      programsApi.list({ search: search.value, status: statusFilter.value }),
      organizationApi.listUnits({ pageSize: 200 }),
    ])
    programs.value = list.data
    units.value = unitList.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat program'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function submit() {
  submitting.value = true
  error.value = null
  try {
    await programsApi.create({
      organization_unit_id: form.organization_unit_id,
      name: form.name,
      objective: form.objective || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
    })
    showForm.value = false
    form.organization_unit_id = ''
    form.name = ''
    form.objective = ''
    form.start_date = ''
    form.end_date = ''
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan program'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Program</h1>
        <p class="text-sm text-slate-500">{{ programs.length }} program</p>
      </div>
      <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
        {{ showForm ? 'Batal' : 'Tambah Program' }}
      </button>
    </header>

    <div v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-unit">Unit Organisasi</label>
        <select id="p-unit" v-model="form.organization_unit_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Pilih unit</option>
          <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }} ({{ u.code }})</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-name">Nama</label>
        <input id="p-name" v-model="form.name" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700" for="p-obj">Tujuan</label>
        <input id="p-obj" v-model="form.objective" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-start">Mulai</label>
        <input id="p-start" v-model="form.start_date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-end">Selesai</label>
        <input id="p-end" v-model="form.end_date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <button type="button" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit" @click="submit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <input v-model="search" placeholder="Cari nama atau kode" class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64" @keyup.enter="load" />
      <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="load">
        <option value="">Semua status</option>
        <option v-for="s in PROGRAM_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="load">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="programs.length === 0" class="text-sm text-slate-500">Belum ada program.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Kode</th>
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2 pr-4">Unit</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in programs" :key="p.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ p.program_code }}</td>
            <td class="py-2 pr-4">
              <router-link :to="`/programs/${p.id}`" class="text-brand-600 hover:underline">{{ p.name }}</router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ p.organization_unit_name }}</td>
            <td class="py-2 text-slate-600">{{ programStatusLabel(p.status) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
