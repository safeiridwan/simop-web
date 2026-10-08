<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { activitiesApi } from '../api'
import type { Activity } from '../types'

const activities = ref<Activity[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const search = ref('')

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data } = await activitiesApi.list({ search: search.value })
    activities.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat kegiatan'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section>
    <header class="mb-6">
      <h1 class="text-xl font-semibold text-slate-900">Kegiatan</h1>
      <p class="text-sm text-slate-500">{{ activities.length }} kegiatan</p>
    </header>

    <div class="mb-4 flex flex-wrap gap-2">
      <input v-model="search" placeholder="Cari kegiatan" class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64" @keyup.enter="load" />
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="load">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="activities.length === 0" class="text-sm text-slate-500">Belum ada kegiatan.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2 pr-4">Program</th>
            <th class="py-2 pr-4">Tanggal</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in activities" :key="a.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 text-slate-900">{{ a.name }}</td>
            <td class="py-2 pr-4">
              <router-link v-if="a.program_id" :to="`/programs/${a.program_id}`" class="text-brand-600 hover:underline">
                {{ a.program_name }}
              </router-link>
              <span v-else class="text-slate-500">—</span>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ a.activity_date || '—' }}</td>
            <td class="py-2 text-slate-600">{{ a.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
