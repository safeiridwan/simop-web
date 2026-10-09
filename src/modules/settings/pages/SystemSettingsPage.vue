<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { useAuthStore } from '@/app/stores/auth'
import { settingsApi } from '../api'
import type { Setting } from '../types'

const auth = useAuthStore()
const settings = ref<Setting[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)
const edits = ref<Record<string, string>>({})

async function load() {
  loading.value = true
  error.value = null
  try {
    settings.value = await settingsApi.list()
    edits.value = Object.fromEntries(settings.value.map((s) => [s.key, s.value]))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat pengaturan'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function save(key: string) {
  saving.value = true
  error.value = null
  notice.value = null
  try {
    await settingsApi.upsert(key, edits.value[key] ?? '')
    notice.value = `Pengaturan ${key} disimpan.`
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan'
  } finally {
    saving.value = false
  }
}

function canUpdate(): boolean {
  return auth.can('settings:update')
}
</script>

<template>
  <section>
    <header class="mb-6">
      <h1 class="text-xl font-semibold text-slate-900">Pengaturan Sistem</h1>
      <p class="text-sm text-slate-500">Nilai konfigurasi organisasi (plan §62)</p>
    </header>

    <p v-if="notice" class="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">{{ notice }}</p>
    <p v-if="error" class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="settings.length === 0" class="text-sm text-slate-500">Belum ada pengaturan.</p>

    <div v-else class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table class="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="p-3">Kunci</th>
            <th class="p-3">Nilai</th>
            <th class="p-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in settings" :key="s.key" class="border-b border-slate-100">
            <td class="p-3 font-mono text-xs text-slate-700">{{ s.key }}</td>
            <td class="p-3">
              <input
                v-model="edits[s.key]"
                :disabled="!canUpdate()"
                class="w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
              />
            </td>
            <td class="p-3">
              <button
                v-if="canUpdate()"
                type="button"
                :disabled="saving"
                class="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                @click="save(s.key)"
              >
                Simpan
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
