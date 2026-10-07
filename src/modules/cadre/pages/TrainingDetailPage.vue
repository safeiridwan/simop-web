<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import BatchPanel from '../components/BatchPanel.vue'
import { cadreApi } from '../api'
import type { TrainingDetail } from '../types'

const route = useRoute()
const id = route.params.id as string

const detail = ref<TrainingDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const openBatch = ref<string | null>(null)

const batchForm = reactive({ name: '', start_date: '', end_date: '', location: '' })

async function load() {
  loading.value = true
  error.value = null
  try {
    detail.value = await cadreApi.getTraining(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat pelatihan'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function addBatch() {
  saving.value = true
  error.value = null
  try {
    await cadreApi.createBatch(id, {
      name: batchForm.name,
      start_date: batchForm.start_date || undefined,
      end_date: batchForm.end_date || undefined,
      location: batchForm.location || undefined,
    })
    batchForm.name = ''
    batchForm.start_date = ''
    batchForm.end_date = ''
    batchForm.location = ''
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menambah angkatan'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="detail">
      <header class="mb-6">
        <router-link to="/cadre-training" class="text-sm text-brand-600 hover:underline">← Pelatihan</router-link>
        <h1 class="text-xl font-semibold text-slate-900">{{ detail.training.name }}</h1>
        <p class="font-mono text-xs text-slate-500">{{ detail.training.code }} · {{ detail.training.status }}</p>
      </header>

      <h2 class="mb-3 font-semibold text-slate-900">Angkatan</h2>
      <div class="space-y-3">
        <div v-for="batch in detail.batches" :key="batch.id" class="rounded-lg border border-slate-200 bg-white">
          <button type="button" class="flex w-full items-center justify-between p-4 text-left" @click="openBatch = openBatch === batch.id ? null : batch.id">
            <span>
              <span class="block text-sm font-medium text-slate-900">{{ batch.name }}</span>
              <span class="text-xs text-slate-500">{{ batch.start_date || '—' }} – {{ batch.end_date || '—' }} · {{ batch.status }}</span>
            </span>
            <span class="text-xs text-brand-600">{{ openBatch === batch.id ? 'Tutup' : 'Kelola' }}</span>
          </button>
          <div v-if="openBatch === batch.id" class="border-t border-slate-100 p-4">
            <BatchPanel :batch="batch" @changed="load" />
          </div>
        </div>
        <p v-if="detail.batches.length === 0" class="text-sm text-slate-500">Belum ada angkatan.</p>
      </div>

      <div class="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Tambah Angkatan</h2>
        <form class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="addBatch">
          <input v-model="batchForm.name" placeholder="Nama angkatan" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="batchForm.start_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="batchForm.end_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="batchForm.location" placeholder="Lokasi" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 lg:col-span-4 lg:w-fit">
            Tambah Angkatan
          </button>
        </form>
      </div>
    </template>
  </section>
</template>
