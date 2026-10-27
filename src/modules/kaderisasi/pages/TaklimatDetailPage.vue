<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AppModal from '@/components/AppModal.vue'
import { useAuthStore } from '@/app/stores/auth'
import { formatDate } from '@/utils/date'
import { kaderisasiApi } from '../api'
import { taklimatStatusLabel, type Level, type Taklimat } from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const id = route.params.id as string

const item = ref<Taklimat | null>(null)
const levels = ref<Level[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const editing = ref(false)
const editForm = ref({ title: '', publish_date: '', target_level_ids: [] as string[] })
const contentHtml = ref('')
const editor = ref<HTMLDivElement | null>(null)

const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')
const confirmMessage = ref('')
let confirmAction: (() => Promise<void>) | null = null

const canUpdate = computed(() => auth.can('kaderisasi:update'))

function notify(message: string, title = 'Pemberitahuan') {
  modalMessage.value = message
  modalTitle.value = title
}

function askConfirm(message: string, action: () => Promise<void>) {
  confirmMessage.value = message
  confirmAction = action
}

async function runConfirm() {
  const action = confirmAction
  confirmMessage.value = ''
  confirmAction = null
  if (action) await action()
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [t, lv] = await Promise.all([kaderisasiApi.getTaklimat(id), kaderisasiApi.levels()])
    item.value = t
    levels.value = lv
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat taklimat'
  } finally {
    loading.value = false
  }
}

onMounted(load)

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

function startEdit() {
  const t = item.value!
  editForm.value = { title: t.title, publish_date: t.publish_date ?? '', target_level_ids: t.targets.map((l) => l.id) }
  contentHtml.value = t.content_html ?? ''
  editing.value = true
}

function exec(command: string) {
  editor.value?.focus()
  document.execCommand(command)
}
function onContentInput() {
  contentHtml.value = editor.value?.innerHTML ?? ''
}

function saveEdit() {
  if (!editForm.value.title.trim() || !editForm.value.publish_date || editForm.value.target_level_ids.length === 0 || !contentHtml.value.trim()) {
    notify('Field berikut wajib diisi: Judul, Tanggal Terbit, Sasaran, Isi Taklimat.')
    return
  }
  void run(async () => {
    await kaderisasiApi.updateTaklimat(id, {
      title: editForm.value.title,
      publish_date: editForm.value.publish_date,
      target_level_ids: editForm.value.target_level_ids,
      content_html: contentHtml.value,
    })
    editing.value = false
  })
}

function publish() {
  void run(() => kaderisasiApi.publishTaklimat(id))
}
function unpublish() {
  void run(() => kaderisasiApi.unpublishTaklimat(id))
}
function remove() {
  askConfirm('Hapus taklimat ini?', async () => {
    await run(async () => {
      await kaderisasiApi.deleteTaklimat(id)
      await router.push('/kaderisasi/taklimat')
    })
  })
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="item">
      <header class="mb-6">
        <AppBreadcrumb :items="[{ label: 'Taklimat', to: '/kaderisasi/taklimat' }, { label: 'Detail Taklimat' }]" />
        <h1 class="text-xl font-semibold text-slate-900">{{ item.title }}</h1>
        <p class="text-sm text-slate-500">{{ formatDate(item.publish_date) }} · {{ taklimatStatusLabel(item.status) }}</p>
      </header>

      <dl class="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div><dt class="text-slate-500">Judul</dt><dd class="text-slate-900">{{ item.title }}</dd></div>
        <div><dt class="text-slate-500">Tanggal Terbit</dt><dd class="text-slate-900">{{ formatDate(item.publish_date) }}</dd></div>
        <div class="sm:col-span-2"><dt class="text-slate-500">Sasaran</dt><dd class="text-slate-900">{{ item.targets.map((l) => l.name).join(', ') || '—' }}</dd></div>
      </dl>

      <div class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-2 font-semibold text-slate-900">Isi Taklimat</h2>
        <div class="prose max-w-none text-sm text-slate-700" v-html="item.content_html" />
      </div>

      <div v-if="canUpdate" class="mb-6 flex flex-wrap gap-2">
        <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="editing ? (editing = false) : startEdit()">
          {{ editing ? 'Batal' : 'Edit' }}
        </button>
        <button v-if="item.status !== 'PUBLISHED'" type="button" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="publish">Terbitkan</button>
        <button v-if="item.status === 'PUBLISHED'" type="button" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="unpublish">Tarik</button>
        <button type="button" class="rounded border border-red-300 px-3 py-2 text-sm text-red-600" @click="remove">Hapus</button>
      </div>

      <form v-if="editing" class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="saveEdit">
        <input v-model="editForm.title" placeholder="Judul" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
        <input v-model="editForm.publish_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        <div class="sm:col-span-2">
          <p class="mb-1 text-sm font-medium text-slate-700">Sasaran (jenjang)</p>
          <div class="flex flex-wrap gap-3">
            <label v-for="l in levels" :key="l.id" class="flex items-center gap-2 text-sm text-slate-700">
              <input v-model="editForm.target_level_ids" type="checkbox" :value="l.id" />
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
          </div>
          <div ref="editor" contenteditable="true" class="min-h-[8rem] rounded border border-slate-300 px-3 py-2 text-sm" @input="onContentInput" v-html="contentHtml" />
        </div>
        <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">Simpan</button>
      </form>
    </template>

    <AppModal :open="modalMessage !== ''" :title="modalTitle" :message="modalMessage" @close="modalMessage = ''" />
    <AppModal :open="confirmMessage !== ''" variant="confirm" title="Konfirmasi" :message="confirmMessage" @close="confirmMessage = ''" @confirm="runConfirm" />
  </section>
</template>
