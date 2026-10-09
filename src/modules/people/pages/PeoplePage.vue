<script setup lang="ts">
import { onMounted, ref } from 'vue'

import PersonForm from '../components/PersonForm.vue'
import { peopleApi } from '../api'
import type { PersonInput } from '../types'
import { usePeople } from '../composables/usePeople'

const { people, meta, loading, error, load } = usePeople()

const search = ref('')
const status = ref('')
const showForm = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)

onMounted(() => void load())

function onFilter() {
  void load(search.value, status.value)
}

async function onCreate(input: PersonInput) {
  submitting.value = true
  formError.value = null
  try {
    await peopleApi.create(input)
    showForm.value = false
    await load(search.value, status.value)
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Gagal menyimpan'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Semua Orang</h1>
        <p v-if="meta" class="text-sm text-slate-500">{{ meta.total }} data</p>
      </div>
      <button
        type="button"
        class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Batal' : 'Tambah Orang' }}
      </button>
    </header>

    <div v-if="showForm" class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <p v-if="formError" class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{{ formError }}</p>
      <PersonForm :submitting="submitting" submit-label="Simpan" duplicate-check @submit="onCreate" />
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <input
        v-model="search"
        placeholder="Cari nama atau kode"
        class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64"
        @keyup.enter="onFilter"
      />
      <select v-model="status" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="onFilter">
        <option value="">Semua status</option>
        <option value="ACTIVE">Aktif</option>
        <option value="INACTIVE">Tidak aktif</option>
        <option value="DECEASED">Meninggal</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onFilter">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="people.length === 0" class="text-sm text-slate-500">Belum ada data orang.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Kode</th>
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2 pr-4">NIK</th>
            <th class="py-2 pr-4">Telepon</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="person in people" :key="person.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ person.person_code }}</td>
            <td class="py-2 pr-4">
              <router-link :to="`/people/${person.id}`" class="text-brand-600 hover:underline">
                {{ person.full_name }}
              </router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ person.nik_masked || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ person.phone_masked || '—' }}</td>
            <td class="py-2 text-slate-600">{{ person.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
