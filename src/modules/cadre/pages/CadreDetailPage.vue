<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { cadreApi } from '../api'
import { CADRE_STATUSES, type CadreHistoryEntry, type CadreLevel, type CadreProfile } from '../types'

const route = useRoute()
const id = route.params.id as string

const profile = ref<CadreProfile | null>(null)
const levels = ref<CadreLevel[]>([])
const history = ref<CadreHistoryEntry[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const promoteForm = reactive({ to_level_id: '', effective_date: '', notes: '' })
const statusForm = reactive({ status: '', notes: '' })

const levelName = (levelId: string | null) => levels.value.find((l) => l.id === levelId)?.name ?? '—'

const promotableLevels = computed(() => levels.value.filter((l) => l.id !== profile.value?.current_level_id))

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const [p, levelList, h] = await Promise.all([cadreApi.get(id), cadreApi.levels(), cadreApi.history(id)])
    profile.value = p
    levels.value = levelList
    history.value = h
    statusForm.status = p.status
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat kader'
  } finally {
    loading.value = false
  }
}

onMounted(refresh)

async function promote() {
  saving.value = true
  error.value = null
  try {
    await cadreApi.promote(id, {
      to_level_id: promoteForm.to_level_id,
      effective_date: promoteForm.effective_date || undefined,
      notes: promoteForm.notes || undefined,
    })
    promoteForm.to_level_id = ''
    promoteForm.effective_date = ''
    promoteForm.notes = ''
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal mempromosikan'
  } finally {
    saving.value = false
  }
}

async function updateStatus() {
  saving.value = true
  error.value = null
  try {
    await cadreApi.updateStatus(id, statusForm.status, statusForm.notes || undefined)
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal mengubah status'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="profile">
      <header class="mb-6">
        <router-link to="/cadres" class="text-sm text-brand-600 hover:underline">← Kader</router-link>
        <h1 class="text-xl font-semibold text-slate-900">{{ profile.full_name }}</h1>
        <p class="font-mono text-xs text-slate-500">{{ profile.person_code }}</p>
        <p class="mt-1 text-sm text-slate-600">Jenjang saat ini: <strong>{{ profile.level_name }}</strong> · {{ profile.status }}</p>
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Promosi Jenjang</h2>
          <p class="mb-3 text-xs text-slate-500">Promosi mengikuti urutan jenjang kecuali kebijakan mengizinkan lompatan.</p>
          <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="promote">
            <div>
              <label class="block text-sm font-medium text-slate-700" for="pr-level">Jenjang Tujuan</label>
              <select id="pr-level" v-model="promoteForm.to_level_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
                <option value="" disabled>Pilih jenjang</option>
                <option v-for="l in promotableLevels" :key="l.id" :value="l.id">{{ l.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700" for="pr-date">Tanggal Efektif</label>
              <input id="pr-date" v-model="promoteForm.effective_date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div class="sm:col-span-2">
              <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
                Promosikan
              </button>
            </div>
          </form>

          <h2 class="mb-3 mt-6 font-semibold text-slate-900">Ubah Status</h2>
          <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="updateStatus">
            <div>
              <label class="block text-sm font-medium text-slate-700" for="c-status">Status</label>
              <select id="c-status" v-model="statusForm.status" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
                <option v-for="s in CADRE_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700" for="c-notes">Catatan</label>
              <input id="c-notes" v-model="statusForm.notes" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div class="sm:col-span-2">
              <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">
                Simpan Status
              </button>
            </div>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Riwayat Jenjang</h2>
          <ol class="space-y-3 text-sm">
            <li v-for="h in history" :key="h.id" class="border-l-2 border-brand-200 pl-3">
              <p class="text-slate-900">
                {{ h.from_level_id ? levelName(h.from_level_id) + ' → ' : '' }}{{ levelName(h.to_level_id) }}
              </p>
              <p class="text-xs text-slate-500">
                {{ h.effective_date || new Date(h.created_at).toLocaleDateString('id-ID') }}
                <span v-if="h.notes"> · {{ h.notes }}</span>
              </p>
            </li>
            <li v-if="history.length === 0" class="text-slate-500">Belum ada riwayat.</li>
          </ol>
        </div>
      </div>
    </template>
  </section>
</template>
