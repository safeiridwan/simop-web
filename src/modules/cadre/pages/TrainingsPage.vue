<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { cadreApi } from '../api'
import type { Training } from '../types'

const trainings = ref<Training[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const showForm = ref(false)
const submitting = ref(false)
const form = reactive({ name: '', description: '' })

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data } = await cadreApi.listTrainings()
    trainings.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat pelatihan'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function submit() {
  submitting.value = true
  error.value = null
  try {
    await cadreApi.createTraining({ name: form.name, description: form.description || undefined })
    showForm.value = false
    form.name = ''
    form.description = ''
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan pelatihan'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Pelatihan Kader</h1>
        <p class="text-sm text-slate-500">{{ trainings.length }} pelatihan</p>
      </div>
      <button
        type="button"
        class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Batal' : 'Tambah Pelatihan' }}
      </button>
    </header>

    <form v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="submit">
      <div>
        <label class="block text-sm font-medium text-slate-700" for="t-name">Nama</label>
        <input id="t-name" v-model="form.name" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="t-desc">Deskripsi</label>
        <input id="t-desc" v-model="form.description" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <button type="submit" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="trainings.length === 0" class="text-sm text-slate-500">Belum ada pelatihan.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Kode</th>
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in trainings" :key="t.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ t.code }}</td>
            <td class="py-2 pr-4">
              <router-link :to="`/cadre-training/${t.id}`" class="text-brand-600 hover:underline">{{ t.name }}</router-link>
            </td>
            <td class="py-2 text-slate-600">{{ t.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
