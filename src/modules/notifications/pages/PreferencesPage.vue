<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { notificationsApi } from '../api'
import { CHANNELS, NOTIFICATION_CATEGORIES, type Preference } from '../types'

const preferences = ref<Preference[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

function stateFor(category: string, channel: string): boolean {
  return preferences.value.find((p) => p.category === category && p.channel === channel)?.enabled ?? true
}

async function load() {
  loading.value = true
  error.value = null
  try {
    preferences.value = await notificationsApi.preferences()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat preferensi'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function toggle(category: string, channel: string, event: Event) {
  const enabled = (event.target as HTMLInputElement).checked
  saving.value = true
  error.value = null
  try {
    const updated = await notificationsApi.setPreference(category, channel, enabled)
    const existing = preferences.value.find((p) => p.category === category && p.channel === channel)
    if (existing) Object.assign(existing, updated)
    else preferences.value.push(updated)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan preferensi'
    await load()
  } finally {
    saving.value = false
  }
}

const categories = computed(() => NOTIFICATION_CATEGORIES)
</script>

<template>
  <section>
    <header class="mb-6">
      <router-link to="/notifications" class="text-sm text-brand-600 hover:underline">← Notifikasi</router-link>
      <h1 class="text-xl font-semibold text-slate-900">Preferensi Notifikasi</h1>
      <p class="text-sm text-slate-500">Atur kanal per jenis notifikasi. Kanal default aktif bila belum diatur.</p>
    </header>

    <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>

    <div v-else class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table class="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="p-3">Jenis</th>
            <th v-for="c in CHANNELS" :key="c.value" class="p-3 text-center">{{ c.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.value" class="border-b border-slate-100">
            <td class="p-3 text-slate-900">{{ cat.label }}</td>
            <td v-for="c in CHANNELS" :key="c.value" class="p-3 text-center">
              <input
                type="checkbox"
                :checked="stateFor(cat.value, c.value)"
                :disabled="saving"
                @change="toggle(cat.value, c.value, $event)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
