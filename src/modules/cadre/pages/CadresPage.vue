<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import PersonPicker from '@/components/PersonPicker.vue'
import type { Person } from '@/modules/people/types'
import { cadreApi } from '../api'
import { CADRE_STATUSES, type CadreLevel, type CadreProfile } from '../types'

const cadres = ref<CadreProfile[]>([])
const levels = ref<CadreLevel[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const showForm = ref(false)
const submitting = ref(false)
const selectedPerson = ref<Person | null>(null)
const form = reactive({ level_id: '', started_at: '', notes: '' })

const search = ref('')
const statusFilter = ref('')

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, levelList] = await Promise.all([
      cadreApi.list({ search: search.value, status: statusFilter.value }),
      cadreApi.levels(),
    ])
    cadres.value = list.data
    levels.value = levelList
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat data kader'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function submit() {
  if (!selectedPerson.value) {
    error.value = 'Pilih orang terlebih dahulu.'
    return
  }
  submitting.value = true
  error.value = null
  try {
    await cadreApi.create({
      person_id: selectedPerson.value.id,
      level_id: form.level_id,
      started_at: form.started_at || undefined,
      notes: form.notes || undefined,
    })
    showForm.value = false
    selectedPerson.value = null
    form.level_id = ''
    form.started_at = ''
    form.notes = ''
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan kader'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Kader</h1>
        <p class="text-sm text-slate-500">{{ cadres.length }} kader</p>
      </div>
      <button
        type="button"
        class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Batal' : 'Tambah Kader' }}
      </button>
    </header>

    <div v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700">Orang</label>
        <PersonPicker v-model="selectedPerson" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="c-level">Jenjang Awal</label>
        <select id="c-level" v-model="form.level_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Pilih jenjang</option>
          <option v-for="l in levels" :key="l.id" :value="l.id">{{ l.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="c-start">Mulai</label>
        <input id="c-start" v-model="form.started_at" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div class="sm:col-span-2">
        <button type="button" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="submit">
          {{ submitting ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <input v-model="search" placeholder="Cari nama atau kode" class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64" @keyup.enter="load" />
      <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="load">
        <option value="">Semua status</option>
        <option v-for="s in CADRE_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="load">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="cadres.length === 0" class="text-sm text-slate-500">Belum ada kader.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2 pr-4">Kode</th>
            <th class="py-2 pr-4">Jenjang</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in cadres" :key="c.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4">
              <router-link :to="`/cadres/${c.id}`" class="text-brand-600 hover:underline">{{ c.full_name }}</router-link>
            </td>
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ c.person_code }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ c.level_name }}</td>
            <td class="py-2 text-slate-600">{{ c.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
