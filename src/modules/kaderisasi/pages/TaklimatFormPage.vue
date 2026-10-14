<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppModal from '@/components/AppModal.vue'
import { kaderisasiApi } from '../api'
import type { Level } from '../types'

const router = useRouter()
const levels = ref<Level[]>([])
const submitting = ref(false)
const error = ref<string | null>(null)
const modalMessage = ref('')

const form = reactive({ title: '', publish_date: '', target_level_ids: [] as string[] })
const contentHtml = ref('')
const editor = ref<HTMLDivElement | null>(null)

async function loadLevels() {
  try {
    levels.value = await kaderisasiApi.levels()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat jenjang'
  }
}

onMounted(loadLevels)

function exec(command: string) {
  editor.value?.focus()
  document.execCommand(command)
}

function onContentInput() {
  contentHtml.value = editor.value?.innerHTML ?? ''
}

function missingFields(): string[] {
  const missing: string[] = []
  if (!form.title.trim()) missing.push('Judul')
  if (!form.publish_date) missing.push('Tanggal Terbit')
  if (form.target_level_ids.length === 0) missing.push('Sasaran (jenjang)')
  if (!contentHtml.value.trim()) missing.push('Isi Taklimat')
  return missing
}

async function submit() {
  const missing = missingFields()
  if (missing.length > 0) {
    modalMessage.value = `Field berikut wajib diisi: ${missing.join(', ')}.`
    return
  }
  submitting.value = true
  error.value = null
  try {
    const created = await kaderisasiApi.createTaklimat({
      title: form.title,
      publish_date: form.publish_date,
      target_level_ids: form.target_level_ids,
      content_html: contentHtml.value,
    })
    await router.push(`/kaderisasi/taklimat/${created.id}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan taklimat'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6">
      <router-link to="/kaderisasi/taklimat" class="text-sm text-brand-600 hover:underline">← Taklimat</router-link>
      <h1 class="text-xl font-semibold text-slate-900">Tambah Taklimat</h1>
    </header>

    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>

    <form class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="submit">
      <input v-model="form.title" placeholder="Judul" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
      <input v-model="form.publish_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <div class="sm:col-span-2">
        <p class="mb-1 text-sm font-medium text-slate-700">Sasaran (jenjang)</p>
        <div class="flex flex-wrap gap-3">
          <label v-for="l in levels" :key="l.id" class="flex items-center gap-2 text-sm text-slate-700">
            <input v-model="form.target_level_ids" type="checkbox" :value="l.id" />
            {{ l.name }}
          </label>
        </div>
      </div>

      <div class="sm:col-span-2">
        <p class="mb-1 text-sm font-medium text-slate-700">Isi Taklimat</p>
        <div class="mb-1 flex gap-1">
          <button type="button" class="rounded border border-slate-300 px-2 py-1 text-xs font-bold" @click="exec('bold')">B</button>
          <button type="button" class="rounded border border-slate-300 px-2 py-1 text-xs italic" @click="exec('italic')">I</button>
          <button type="button" class="rounded border border-slate-300 px-2 py-1 text-xs" @click="exec('insertUnorderedList')">• List</button>
          <button type="button" class="rounded border border-slate-300 px-2 py-1 text-xs" @click="exec('insertOrderedList')">1. List</button>
        </div>
        <div ref="editor" contenteditable="true" class="min-h-[8rem] rounded border border-slate-300 px-3 py-2 text-sm" @input="onContentInput" />
      </div>

      <button type="submit" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <AppModal :open="modalMessage !== ''" title="Pemberitahuan" :message="modalMessage" @close="modalMessage = ''" />
  </section>
</template>
