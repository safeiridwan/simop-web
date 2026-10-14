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
  DISTRIBUTION_STATUSES,
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
})

const dispoForm = reactive({ to_user_id: '', instruction: 'TINDAKLANJUTI', note: '' })
const distForm = reactive({ status: 'PENDING', tracking_number: '', email_link: '', wa_link: '' })

const letter = computed(() => detail.value?.letter ?? null)
const isMasuk = computed(() => letter.value?.category === 'MASUK')
const canUpdate = computed(() => auth.can('correspondence:update'))
const canDisposition = computed(() => auth.can('correspondence:disposition'))
const canApprove = computed(() => auth.can('correspondence:approve'))
const canSign = computed(() => auth.can('correspondence:sign'))
const editable = computed(() => letter.value != null && letter.value.status !== 'RELEASED')

const coordination = computed(() => detail.value?.approvals.find((a) => a.stage === 'COORDINATION') ?? null)

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
    distForm.status = l.distribution_status
    distForm.tracking_number = l.tracking_number ?? ''
    distForm.email_link = l.email_link ?? ''
    distForm.wa_link = l.wa_link ?? ''
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
    })
    editing.value = false
  })
}

function submitLetter() {
  void run(() => correspondenceApi.submitLetter(id))
}

function approveCoordination() {
  void run(() => correspondenceApi.approveLetter(id))
}

function sign() {
  void run(() => correspondenceApi.signLetter(id))
}

function reject(stage: string) {
  const note = window.prompt('Alasan penolakan:')
  if (!note) return
  void run(() => correspondenceApi.rejectLetter(id, stage, note))
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

function saveDistribution() {
  void run(() =>
    correspondenceApi.distribute(id, {
      status: distForm.status,
      tracking_number: distForm.tracking_number || undefined,
      email_link: distForm.email_link || undefined,
      wa_link: distForm.wa_link || undefined,
    }),
  )
}

function download(fileId: string | null) {
  if (fileId) void downloadFile(`/api/v1/files/${fileId}`, fileId)
}

function mailto(): string {
  return `mailto:?subject=${encodeURIComponent(letter.value?.perihal ?? '')}`
}
function waLink(): string {
  return `https://wa.me/?text=${encodeURIComponent(letter.value?.perihal ?? '')}`
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
        </div>
        <div v-if="letter.content_html" class="prose mt-3 max-w-none text-sm text-slate-700" v-html="letter.content_html" />
      </div>

      <div v-if="canUpdate && editable" class="mb-6 flex gap-2">
        <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editing = !editing">
          {{ editing ? 'Batal' : 'Edit' }}
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

      <!-- Surat Keluar: persetujuan -->
      <div v-if="!isMasuk" class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Persetujuan</h2>
        <ul class="mb-3 space-y-2 text-sm">
          <li v-for="a in detail.approvals" :key="a.stage" class="rounded border border-slate-100 p-2">
            <span class="text-slate-900">{{ a.stage === 'COORDINATION' ? 'Paraf Koordinasi' : 'Tanda Tangan Pimpinan' }}</span>
            <span class="block text-xs text-slate-500">
              {{ a.decision === 'APPROVED' ? 'Disetujui' : a.decision === 'REJECTED' ? 'Ditolak' : 'Menunggu' }}
              <span v-if="a.actor_name"> · {{ a.actor_name }}</span>
              <span v-if="a.decided_at"> · {{ formatDate(a.decided_at) }}</span>
            </span>
            <span v-if="a.note" class="block text-xs text-slate-600">{{ a.note }}</span>
          </li>
        </ul>
        <div class="flex flex-wrap gap-2">
          <button
            v-if="canUpdate && (letter.status === 'CREATED' || letter.status === 'REJECTED')"
            type="button"
            :disabled="saving"
            class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            @click="submitLetter"
          >
            Ajukan
          </button>
          <button
            v-if="canApprove && letter.status === 'REQUESTED'"
            type="button"
            :disabled="saving"
            class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            @click="approveCoordination"
          >
            Setujui Paraf Koordinasi
          </button>
          <button
            v-if="canSign && letter.status === 'ON_PROGRESS'"
            type="button"
            :disabled="saving"
            class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            @click="sign"
          >
            Tanda Tangan &amp; Terbitkan Nomor
          </button>
          <button
            v-if="canApprove && (letter.status === 'REQUESTED' || letter.status === 'ON_PROGRESS')"
            type="button"
            :disabled="saving"
            class="rounded border border-red-300 px-3 py-2 text-sm text-red-600"
            @click="reject(coordination?.decision === 'APPROVED' ? 'SIGNATURE' : 'COORDINATION')"
          >
            Tolak
          </button>
        </div>
      </div>

      <!-- Surat Keluar: distribusi -->
      <div v-if="!isMasuk && letter.status === 'RELEASED'" class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Distribusi &amp; Pengiriman</h2>
        <form class="grid gap-2 sm:grid-cols-2" @submit.prevent="saveDistribution">
          <select v-model="distForm.status" class="rounded border border-slate-300 px-3 py-2 text-sm">
            <option v-for="s in DISTRIBUTION_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
          <input v-model="distForm.tracking_number" placeholder="Resi pengiriman fisik" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="distForm.email_link" placeholder="Tautan email" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="distForm.wa_link" placeholder="Tautan WhatsApp" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button v-if="canUpdate" type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm sm:w-fit">Simpan Distribusi</button>
        </form>
        <div class="mt-3 flex gap-3 text-sm">
          <a :href="mailto()" class="text-brand-600 hover:underline">Email</a>
          <a :href="waLink()" target="_blank" rel="noopener" class="text-brand-600 hover:underline">WhatsApp</a>
        </div>
      </div>
    </template>

    <AppModal :open="modalMessage !== ''" :title="modalTitle" :message="modalMessage" @close="modalMessage = ''" />
  </section>
</template>
