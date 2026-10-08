<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { financeApi } from '../api'
import type { Fund } from '../types'

const funds = ref<Fund[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const form = reactive({ code: '', name: '', description: '' })

async function load() {
  loading.value = true
  try {
    funds.value = await financeApi.listFunds()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat dana'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function submit() {
  submitting.value = true
  error.value = null
  try {
    await financeApi.createFund({ code: form.code, name: form.name, description: form.description || undefined })
    showForm.value = false
    form.code = ''
    form.name = ''
    form.description = ''
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan dana'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-xl font-semibold text-slate-900">Dana</h1>
      <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
        {{ showForm ? 'Batal' : 'Tambah Dana' }}
      </button>
    </header>

    <form v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3" @submit.prevent="submit">
      <input v-model="form.code" placeholder="Kode" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.name" placeholder="Nama dana" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.description" placeholder="Deskripsi" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <button type="submit" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-3 sm:w-fit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="funds.length === 0" class="text-sm text-slate-500">Belum ada dana.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[30rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Kode</th>
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2">Deskripsi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in funds" :key="f.id" class="border-b border-slate-100">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ f.code }}</td>
            <td class="py-2 pr-4 text-slate-900">{{ f.name }}</td>
            <td class="py-2 text-slate-600">{{ f.description || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
