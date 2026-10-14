<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppModal from '@/components/AppModal.vue'
import FileDropzone from '@/components/FileDropzone.vue'
import { correspondenceApi } from '../api'
import { SIFAT_OPTIONS, type Reference } from '../types'

const route = useRoute()
const router = useRouter()
const category = computed(() => (route.query.category === 'KELUAR' ? 'KELUAR' : 'MASUK'))

const today = new Date().toISOString().slice(0, 10)
const form = reactive({
  origin_number: '',
  letter_date: '',
  received_date: today,
  sender: '',
  recipient: '',
  perihal: '',
  summary: '',
  sifat: 'Biasa',
  jenis_id: '',
  lampiran: '0',
})
const contentHtml = ref('')
const editor = ref<HTMLDivElement | null>(null)
const file = ref<File | null>(null)

const jenisList = ref<Reference[]>([])
const submitting = ref(false)
const error = ref<string | null>(null)
const modalMessage = ref('')

const isMasuk = computed(() => category.value === 'MASUK')

async function loadReferences() {
  if (isMasuk.value) return
  try {
    jenisList.value = await correspondenceApi.references('JENIS')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat klasifikasi'
  }
}

onMounted(loadReferences)

function exec(command: string) {
  editor.value?.focus()
  document.execCommand(command)
}

function onContentInput() {
  contentHtml.value = editor.value?.innerHTML ?? ''
}

function missingFields(): string[] {
  const missing: string[] = []
  if (!form.perihal.trim()) missing.push('Perihal')
  if (isMasuk.value) {
    if (!form.origin_number.trim()) missing.push('Nomor Surat Asal')
    if (!form.letter_date) missing.push('Tanggal Surat')
    if (!form.received_date) missing.push('Tanggal Diterima')
    if (!form.sender.trim()) missing.push('Pengirim')
    if (!form.recipient.trim()) missing.push('Penerima/Tujuan Surat')
    if (!form.summary.trim()) missing.push('Ringkasan Isi')
    if (!form.sifat) missing.push('Tingkat Sifat Surat')
    if (!file.value) missing.push('Berkas Digital')
  } else {
    if (!form.jenis_id) missing.push('Jenis/Klasifikasi Surat')
    if (!form.recipient.trim()) missing.push('Tujuan Surat')
    if (!contentHtml.value.trim() && !file.value) missing.push('Isi Surat')
  }
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
    let fileId: string | undefined
    if (file.value) {
      const uploaded = await correspondenceApi.upload(isMasuk.value ? 'surat-masuk' : 'surat-keluar', file.value)
      fileId = uploaded.file_id
    }
    const created = await correspondenceApi.createLetter({
      category: category.value,
      jenis_id: form.jenis_id || undefined,
      origin_number: form.origin_number || undefined,
      letter_date: form.letter_date || undefined,
      received_date: form.received_date || undefined,
      sender: form.sender || undefined,
      recipient: form.recipient || undefined,
      perihal: form.perihal,
      summary: form.summary || undefined,
      sifat: isMasuk.value ? form.sifat : undefined,
      lampiran: !isMasuk.value ? Number(form.lampiran) || 0 : 0,
      content_html: !isMasuk.value && !fileId ? contentHtml.value : undefined,
      content_file_id: !isMasuk.value ? fileId : undefined,
      file_id: isMasuk.value ? fileId : undefined,
    })
    await router.push(`/administration/letters/${created.id}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan surat'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6">
      <router-link to="/administration/letters" class="text-sm text-brand-600 hover:underline">← Manajemen Surat</router-link>
      <h1 class="text-xl font-semibold text-slate-900">
        {{ isMasuk ? 'Catat Surat Masuk' : 'Buat Surat Keluar' }}
      </h1>
    </header>

    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>

    <form class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="submit">
      <template v-if="isMasuk">
        <input v-model="form.origin_number" placeholder="Nomor Surat Asal" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input v-model="form.letter_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <label class="flex flex-col text-sm text-slate-600">
          Tanggal Diterima
          <input v-model="form.received_date" type="date" class="mt-1 rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <input v-model="form.sender" placeholder="Pengirim" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input v-model="form.recipient" placeholder="Penerima/Tujuan Surat" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
        <input v-model="form.perihal" placeholder="Perihal" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
        <textarea v-model="form.summary" placeholder="Ringkasan Isi" rows="3" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
        <select v-model="form.sifat" class="rounded border border-slate-300 px-3 py-2 text-sm">
          <option v-for="s in SIFAT_OPTIONS" :key="s" :value="s">{{ s }}</option>
        </select>
        <div class="sm:col-span-2">
          <FileDropzone
            :allowed-types="['application/pdf', 'image/jpeg']"
            accept=".pdf,.jpg,.jpeg"
            :max-bytes="10 * 1024 * 1024"
            label="Unggah berkas digital (PDF atau JPEG, maks 10 MB)"
            @update:file="file = $event"
          />
        </div>
      </template>

      <template v-else>
        <select v-model="form.jenis_id" class="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>Jenis/Klasifikasi Surat</option>
          <option v-for="j in jenisList" :key="j.id" :value="j.id">
            {{ j.code }}{{ j.name ? ` - ${j.name}` : '' }}
          </option>
        </select>
        <input v-model="form.recipient" placeholder="Tujuan Surat" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input v-model="form.letter_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <label class="flex flex-col text-sm text-slate-600">
          Lampiran (jumlah lembar)
          <input v-model="form.lampiran" type="number" min="0" step="1" class="mt-1 rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <input v-model="form.perihal" placeholder="Perihal" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />

        <div class="sm:col-span-2">
          <p class="mb-1 text-sm font-medium text-slate-700">Isi Surat (rich text)</p>
          <div class="mb-1 flex gap-1">
            <button type="button" class="rounded border border-slate-300 px-2 py-1 text-xs font-bold" @click="exec('bold')">B</button>
            <button type="button" class="rounded border border-slate-300 px-2 py-1 text-xs italic" @click="exec('italic')">I</button>
            <button type="button" class="rounded border border-slate-300 px-2 py-1 text-xs" @click="exec('insertUnorderedList')">• List</button>
            <button type="button" class="rounded border border-slate-300 px-2 py-1 text-xs" @click="exec('insertOrderedList')">1. List</button>
          </div>
          <div
            ref="editor"
            contenteditable="true"
            class="min-h-[8rem] rounded border border-slate-300 px-3 py-2 text-sm"
            @input="onContentInput"
          />
        </div>

        <div class="sm:col-span-2">
          <p class="mb-1 text-sm text-slate-600">Atau unggah draf dokumen (.docx)</p>
          <FileDropzone
            :allowed-types="[
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/msword',
            ]"
            accept=".docx,.doc"
            :max-bytes="10 * 1024 * 1024"
            label="Unggah draf .docx (maks 10 MB)"
            @update:file="file = $event"
          />
        </div>
      </template>

      <button
        type="submit"
        :disabled="submitting"
        class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit"
      >
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <AppModal :open="modalMessage !== ''" title="Pemberitahuan" :message="modalMessage" @close="modalMessage = ''" />
  </section>
</template>
