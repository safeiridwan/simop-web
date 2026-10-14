<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppModal from '@/components/AppModal.vue'
import { useAuthStore } from '@/app/stores/auth'
import { downloadFile } from '@/services/http'
import { usersApi } from '@/modules/users/api'
import type { User } from '@/modules/users/types'
import { correspondenceApi } from '../api'
import {
  DISPOSITION_INSTRUCTIONS,
  SIFAT_OPTIONS,
  categoryLabel,
  letterStatusLabel,
  type LetterDetail,
} from '../types'
import { formatDate } from '@/utils/date'

const route = useRoute()
const auth = useAuthStore()
const id = route.params.id as string

const detail = ref<LetterDetail | null>(null)
const users = ref<User[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const editing = ref(false)
const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')

const editForm = reactive({
  origin_number: '',
  letter_date: '',
  received_date: '',
  sender: '',
  recipient: '',
  perihal: '',
  summary: '',
  sifat: '',
  jenis_id: '',
  lampiran: '0',
})

const dispoForm = reactive({ to_user_id: '', instruction: 'TINDAKLANJUTI', note: '' })

const letter = computed(() => detail.value?.letter ?? null)
const isMasuk = computed(() => letter.value?.category === 'MASUK')
const canUpdate = computed(() => auth.can('correspondence:update'))
const canDisposition = computed(() => auth.can('correspondence:disposition'))
const canApprove = computed(() => auth.can('correspondence:approve'))
const editable = computed(() => letter.value != null && letter.value.status !== 'RELEASED')

function notify(message: string, title = 'Pemberitahuan') {
  modalMessage.value = message
  modalTitle.value = title
}

async function load() {
  loading.value = true
  error.value = null
  try {
    detail.value = await correspondenceApi.getLetter(id)
    const l = detail.value.letter
    editForm.origin_number = l.origin_number ?? ''
    editForm.letter_date = l.letter_date ?? ''
    editForm.received_date = l.received_date ?? ''
    editForm.sender = l.sender ?? ''
    editForm.recipient = l.recipient ?? ''
    editForm.perihal = l.perihal
    editForm.summary = l.summary ?? ''
    editForm.sifat = l.sifat ?? 'Biasa'
    editForm.jenis_id = l.jenis_id ?? ''
    editForm.lampiran = String(l.lampiran ?? 0)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat surat'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await load()
  if (canDisposition.value) {
    try {
      const res = await usersApi.list({ pageSize: 200, status: 'ACTIVE' })
      users.value = res.data
    } catch {
      users.value = []
    }
  }
})

async function run(fn: () => Promise<unknown>) {
  saving.value = true
  error.value = null
  try {
    await fn()
    await load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Operasi gagal', 'Gagal')
  } finally {
    saving.value = false
  }
}

function saveEdit() {
  void run(async () => {
    await correspondenceApi.updateLetter(id, {
      category: letter.value!.category,
      jenis_id: editForm.jenis_id || undefined,
      origin_number: editForm.origin_number || undefined,
      letter_date: editForm.letter_date || undefined,
      received_date: editForm.received_date || undefined,
      sender: editForm.sender || undefined,
      recipient: editForm.recipient || undefined,
      perihal: editForm.perihal,
      summary: editForm.summary || undefined,
      sifat: isMasuk.value ? editForm.sifat : undefined,
      lampiran: !isMasuk.value ? Number(editForm.lampiran) || 0 : 0,
    })
    editing.value = false
  })
}

function submitLetter() {
  void run(() => correspondenceApi.submitLetter(id))
}

function approveLetter() {
  void run(() => correspondenceApi.approveLetter(id))
}

function rejectLetter() {
  const note = window.prompt('Alasan penolakan:')
  if (!note) return
  void run(() => correspondenceApi.rejectLetter(id, 'SIGNATURE', note))
}

function addDisposition() {
  if (!dispoForm.to_user_id) {
    notify('Penerima disposisi wajib dipilih.')
    return
  }
  void run(async () => {
    await correspondenceApi.addDisposition(id, {
      to_user_id: dispoForm.to_user_id,
      instruction: dispoForm.instruction,
      note: dispoForm.note || undefined,
    })
    dispoForm.to_user_id = ''
    dispoForm.note = ''
  })
}

function toggleDisposition(dispoId: string, status: string) {
  void run(() => correspondenceApi.setDispositionStatus(dispoId, status))
}

function downloadGenerated() {
  if (letter.value?.generated_file_id) {
    void downloadFile(`/api/v1/files/${letter.value.generated_file_id}`, `${letter.value.letter_number ?? 'surat'}.docx`)
  }
}

function download(fileId: string | null) {
  if (fileId) void downloadFile(`/api/v1/files/${fileId}`, fileId)
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="detail && letter">
      <header class="mb-6">
        <router-link to="/administration/letters" class="text-sm text-brand-600 hover:underline">← Manajemen Surat</router-link>
        <h1 class="text-xl font-semibold text-slate-900">{{ letter.perihal }}</h1>
        <p class="text-sm text-slate-500">
          {{ categoryLabel(letter.category) }} · {{ letterStatusLabel(letter.status) }}
          <span v-if="letter.letter_number"> · <span class="font-mono">{{ letter.letter_number }}</span></span>
        </p>
      </header>

      <dl class="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div><dt class="text-slate-500">Nomor Surat Asal</dt><dd class="text-slate-900">{{ letter.origin_number || '—' }}</dd></div>
        <div><dt class="text-slate-500">Nomor Surat</dt><dd class="text-slate-900">{{ letter.letter_number || '—' }}</dd></div>
        <div><dt class="text-slate-500">Tanggal Surat</dt><dd class="text-slate-900">{{ formatDate(letter.letter_date) }}</dd></div>
        <div v-if="isMasuk"><dt class="text-slate-500">Tanggal Diterima</dt><dd class="text-slate-900">{{ formatDate(letter.received_date) }}</dd></div>
        <div v-if="isMasuk"><dt class="text-slate-500">Pengirim</dt><dd class="text-slate-900">{{ letter.sender || '—' }}</dd></div>
        <div><dt class="text-slate-500">{{ isMasuk ? 'Penerima/Tujuan' : 'Tujuan Surat' }}</dt><dd class="text-slate-900">{{ letter.recipient || '—' }}</dd></div>
        <div><dt class="text-slate-500">Jenis/Klasifikasi</dt><dd class="text-slate-900">{{ letter.jenis_code || '—' }}</dd></div>
        <div v-if="isMasuk"><dt class="text-slate-500">Tingkat Sifat</dt><dd class="text-slate-900">{{ letter.sifat || '—' }}</dd></div>
        <div v-if="!isMasuk"><dt class="text-slate-500">Lampiran</dt><dd class="text-slate-900">{{ letter.lampiran }} lembar</dd></div>
      </dl>

      <div class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-2 font-semibold text-slate-900">Ringkasan Isi</h2>
        <p class="text-sm text-slate-700">{{ letter.summary || '—' }}</p>
        <div class="mt-3 flex flex-wrap gap-3 text-sm">
          <button v-if="letter.file_id" type="button" class="text-brand-600 hover:underline" @click="download(letter.file_id)">
            Unduh Berkas Digital
          </button>
          <button v-if="letter.content_file_id" type="button" class="text-brand-600 hover:underline" @click="download(letter.content_file_id)">
            Unduh Draf .docx
          </button>
          <button v-if="letter.generated_file_id" type="button" class="font-medium text-brand-600 hover:underline" @click="downloadGenerated">
            Unduh Surat (.docx)
          </button>
        </div>
        <div v-if="letter.content_html" class="prose mt-3 max-w-none text-sm text-slate-700" v-html="letter.content_html" />
      </div>

      <div v-if="(canUpdate && editable) || (!isMasuk && canUpdate && (letter.status === 'CREATED' || letter.status === 'REJECTED'))" class="mb-6 flex gap-2">
        <button v-if="canUpdate && editable" type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editing = !editing">
          {{ editing ? 'Batal' : 'Edit' }}
        </button>
        <button
          v-if="!isMasuk && canUpdate && (letter.status === 'CREATED' || letter.status === 'REJECTED')"
          type="button"
          :disabled="saving"
          class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          @click="submitLetter"
        >
          Ajukan
        </button>
      </div>

      <form v-if="editing" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="saveEdit">
        <input v-if="isMasuk" v-model="editForm.origin_number" placeholder="Nomor Surat Asal" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input v-model="editForm.letter_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input v-if="isMasuk" v-model="editForm.received_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input v-if="isMasuk" v-model="editForm.sender" placeholder="Pengirim" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input v-model="editForm.recipient" placeholder="Tujuan" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input v-model="editForm.perihal" placeholder="Perihal" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
        <textarea v-model="editForm.summary" placeholder="Ringkasan" rows="2" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
        <select v-if="isMasuk" v-model="editForm.sifat" class="rounded border border-slate-300 px-3 py-2 text-sm">
          <option v-for="s in SIFAT_OPTIONS" :key="s" :value="s">{{ s }}</option>
        </select>
        <input v-if="!isMasuk" v-model="editForm.lampiran" type="number" min="0" step="1" placeholder="Lampiran (jumlah lembar)" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">
          Simpan
        </button>
      </form>

      <!-- Surat Masuk: disposisi -->
      <div v-if="isMasuk" class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Lembar Disposisi Digital</h2>
        <ul class="mb-3 space-y-2 text-sm">
          <li v-for="d in detail.dispositions" :key="d.id" class="rounded border border-slate-100 p-2">
            <span class="text-slate-900">{{ d.from_user_name || 'Pimpinan' }} → {{ d.to_user_name || 'Bawahan' }}</span>
            <span class="block text-xs text-slate-500">
              {{ DISPOSITION_INSTRUCTIONS.find((i) => i.value === d.instruction)?.label ?? d.instruction }}
              · {{ d.status === 'DONE' ? 'Selesai' : 'Proses' }}
            </span>
            <span v-if="d.note" class="block text-xs text-slate-600">{{ d.note }}</span>
            <button
              v-if="canDisposition"
              type="button"
              class="mt-1 text-xs text-brand-600 hover:underline"
              @click="toggleDisposition(d.id, d.status === 'DONE' ? 'PENDING' : 'DONE')"
            >
              {{ d.status === 'DONE' ? 'Tandai Proses' : 'Tandai Selesai' }}
            </button>
          </li>
          <li v-if="detail.dispositions.length === 0" class="text-slate-500">Belum ada disposisi.</li>
        </ul>
        <form v-if="canDisposition" class="grid gap-2 sm:grid-cols-2" @submit.prevent="addDisposition">
          <select v-model="dispoForm.to_user_id" class="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="" disabled>Penerima (bawahan)</option>
            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.full_name }}</option>
          </select>
          <select v-model="dispoForm.instruction" class="rounded border border-slate-300 px-3 py-2 text-sm">
            <option v-for="i in DISPOSITION_INSTRUCTIONS" :key="i.value" :value="i.value">{{ i.label }}</option>
          </select>
          <input v-model="dispoForm.note" placeholder="Catatan" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
          <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm sm:w-fit">Tambah Disposisi</button>
        </form>
      </div>

      <!-- Surat Keluar: persetujuan satu tahap -->
      <div v-if="!isMasuk && letter.status === 'REQUESTED'" class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Persetujuan</h2>
        <p class="mb-3 text-sm text-slate-600">Surat menunggu persetujuan. Menyetujui akan menerbitkan nomor surat dan membuat file Word otomatis.</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-if="canApprove"
            type="button"
            :disabled="saving"
            class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            @click="approveLetter"
          >
            Disetujui
          </button>
          <button
            v-if="canApprove"
            type="button"
            :disabled="saving"
            class="rounded border border-red-300 px-3 py-2 text-sm text-red-600 disabled:opacity-50"
            @click="rejectLetter"
          >
            Ditolak
          </button>
        </div>
      </div>

      <!-- Surat Keluar: hasil -->
      <div v-if="!isMasuk && letter.status === 'RELEASED'" class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Surat Terbit</h2>
        <p class="mb-3 text-sm text-slate-600">
          Nomor surat <span class="font-mono">{{ letter.letter_number }}</span> telah diterbitkan dan file Word dibuat otomatis.
        </p>
        <button v-if="letter.generated_file_id" type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600" @click="downloadGenerated">
          Unduh Surat (.docx)
        </button>
      </div>
    </template>

    <AppModal :open="modalMessage !== ''" :title="modalTitle" :message="modalMessage" @close="modalMessage = ''" />
  </section>
</template>
