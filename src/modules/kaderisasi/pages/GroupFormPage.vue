<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppModal from '@/components/AppModal.vue'
import { kaderisasiApi } from '../api'
import { GROUP_STATUSES, type Level } from '../types'

const router = useRouter()
const levels = ref<Level[]>([])
const submitting = ref(false)
const error = ref<string | null>(null)
const modalMessage = ref('')

const form = reactive({ name: '', murabbi: '', level_id: '', status: 'ACTIVE' })

onMounted(async () => {
  try {
    levels.value = await kaderisasiApi.levels()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat jenjang'
  }
})

async function submit() {
  const missing: string[] = []
  if (!form.name.trim()) missing.push('Nama Grup')
  if (!form.murabbi.trim()) missing.push('Murabbi')
  if (!form.level_id) missing.push('Jenjang')
  if (missing.length > 0) {
    modalMessage.value = `Field berikut wajib diisi: ${missing.join(', ')}.`
    return
  }
  submitting.value = true
  error.value = null
  try {
    const created = await kaderisasiApi.createGroup({
      name: form.name,
      murabbi: form.murabbi,
      level_id: form.level_id,
      status: form.status,
    })
    await router.push(`/kaderisasi/grup-pembinaan/${created.id}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan grup'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6">
      <router-link to="/kaderisasi/grup-pembinaan" class="text-sm text-brand-600 hover:underline">← Grup Pembinaan</router-link>
      <h1 class="text-xl font-semibold text-slate-900">Tambah Grup Pembinaan</h1>
    </header>

    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>

    <form class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="submit">
      <input v-model="form.name" placeholder="Nama Grup" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="form.murabbi" placeholder="Murabbi" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <select v-model="form.level_id" class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="" disabled>Jenjang</option>
        <option v-for="l in levels" :key="l.id" :value="l.id">{{ l.name }}</option>
      </select>
      <select v-model="form.status" class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option v-for="s in GROUP_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="submit" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <AppModal :open="modalMessage !== ''" title="Pemberitahuan" :message="modalMessage" @close="modalMessage = ''" />
  </section>
</template>
