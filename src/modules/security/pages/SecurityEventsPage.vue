<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { securityApi } from '../api'
import { EVENT_TYPES, eventTypeLabel, type SecurityEvent } from '../types'

const events = ref<SecurityEvent[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const filter = ref('')

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data } = await securityApi.events(filter.value)
    events.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat peristiwa keamanan'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section>
    <header class="mb-6">
      <h1 class="text-xl font-semibold text-slate-900">Peristiwa Keamanan</h1>
      <p class="text-sm text-slate-500">Login, penguncian akun, dan penyalahgunaan token</p>
    </header>

    <div class="mb-4 flex flex-wrap gap-2">
      <select v-model="filter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="load">
        <option v-for="t in EVENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="load">Muat ulang</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="events.length === 0" class="text-sm text-slate-500">Tidak ada peristiwa.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Waktu</th>
            <th class="py-2 pr-4">Peristiwa</th>
            <th class="py-2 pr-4">Email</th>
            <th class="py-2">IP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in events" :key="e.id" class="border-b border-slate-100">
            <td class="py-2 pr-4 text-slate-600">{{ new Date(e.created_at).toLocaleString('id-ID') }}</td>
            <td class="py-2 pr-4">
              <span
                class="rounded px-1.5 py-0.5 text-xs"
                :class="e.event_type === 'LOGIN_SUCCESS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
              >
                {{ eventTypeLabel(e.event_type) }}
              </span>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ e.email || '—' }}</td>
            <td class="py-2 font-mono text-xs text-slate-500">{{ e.ip_address || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
