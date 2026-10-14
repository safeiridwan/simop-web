<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import AppModal from '@/components/AppModal.vue'
import { useAuthStore } from '@/app/stores/auth'
import { correspondenceApi } from '../api'
import { TEMPLATE_VARIABLES, renderTemplatePreview, type NumberTemplate, type Reference, type Token } from '../types'

const auth = useAuthStore()
const canEdit = computed(() => auth.can('correspondence:create'))

const references = ref<Reference[]>([])
const templates = ref<NumberTemplate[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const modalMessage = ref('')
const modalTitle = ref('Pemberitahuan')
const confirmMessage = ref('')
let confirmAction: (() => Promise<void>) | null = null

const refForm = reactive({ kind: 'JENIS', code: '', name: '', retention_years: '' as string | number })
const editingRefId = ref<string | null>(null)

const tokenForm = reactive({ name: '' })
const tokens = ref<Token[]>([])
const editingTemplateId = ref<string | null>(null)
const staticText = ref('')
const dragging = ref(false)

const kindLabels: Record<string, string> = {
  JENIS: 'Jenis Surat',
  KODE_JENIS: 'Kode Jenis',
  WILAYAH: 'Kode Wilayah',
  ORGANISASI: 'Organisasi',
}

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
    const [refs, tpls] = await Promise.all([correspondenceApi.references(), correspondenceApi.templates()])
    references.value = refs
    templates.value = tpls
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function saveReference() {
  if (!refForm.code.trim()) {
    notify('Kode klasifikasi wajib diisi.')
    return
  }
  saving.value = true
  try {
    const payload = {
      code: refForm.code,
      name: refForm.name || undefined,
      retention_years: refForm.retention_years === '' ? undefined : Number(refForm.retention_years),
    }
    if (editingRefId.value) {
      await correspondenceApi.updateReference(editingRefId.value, payload)
    } else {
      await correspondenceApi.createReference({ kind: refForm.kind, ...payload })
    }
    resetRefForm()
    await load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal menyimpan klasifikasi', 'Gagal')
  } finally {
    saving.value = false
  }
}

function resetRefForm() {
  refForm.kind = 'JENIS'
  refForm.code = ''
  refForm.name = ''
  refForm.retention_years = ''
  editingRefId.value = null
}

function editReference(ref: Reference) {
  editingRefId.value = ref.id
  refForm.kind = ref.kind
  refForm.code = ref.code
  refForm.name = ref.name ?? ''
  refForm.retention_years = ref.retention_years ?? ''
}

function removeReference(ref: Reference) {
  askConfirm(`Hapus klasifikasi ${ref.code}?`, async () => {
    try {
      await correspondenceApi.deleteReference(ref.id)
      await load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal menghapus klasifikasi', 'Gagal')
    }
  })
}

function retentionLabel(ref: Reference): string {
  return ref.retention_years == null ? 'Permanen' : `${ref.retention_years} tahun`
}

// --- template builder ---

function addVariable(value: string) {
  tokens.value.push({ type: 'variable', value })
}

function addText() {
  if (!staticText.value) return
  tokens.value.push({ type: 'text', value: staticText.value })
  staticText.value = ''
}

function removeToken(index: number) {
  tokens.value.splice(index, 1)
}

function onDragStart(event: DragEvent, value: string) {
  event.dataTransfer?.setData('text/plain', value)
}

function onDrop(event: DragEvent) {
  dragging.value = false
  const value = event.dataTransfer?.getData('text/plain')
  if (value) addVariable(value)
}

const preview = computed(() => renderTemplatePreview(tokens.value))

async function saveTemplate() {
  if (!tokenForm.name.trim()) {
    notify('Nama template wajib diisi.')
    return
  }
  if (!tokens.value.some((t) => t.type === 'variable' && t.value === 'Nomor')) {
    notify('Template nomor wajib memuat variabel {Nomor}.')
    return
  }
  saving.value = true
  try {
    const payload = { name: tokenForm.name, tokens: tokens.value }
    if (editingTemplateId.value) {
      await correspondenceApi.updateTemplate(editingTemplateId.value, payload)
    } else {
      await correspondenceApi.createTemplate({ ...payload, activate: templates.value.length === 0 })
    }
    resetTemplate()
    await load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal menyimpan template', 'Gagal')
  } finally {
    saving.value = false
  }
}

function resetTemplate() {
  tokenForm.name = ''
  tokens.value = []
  editingTemplateId.value = null
}

function editTemplate(tpl: NumberTemplate) {
  editingTemplateId.value = tpl.id
  tokenForm.name = tpl.name
  tokens.value = tpl.tokens.map((t) => ({ ...t }))
}

async function activateTemplate(id: string) {
  try {
    await correspondenceApi.activateTemplate(id)
    await load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Gagal mengaktifkan template', 'Gagal')
  }
}

function removeTemplate(tpl: NumberTemplate) {
  askConfirm(`Hapus template ${tpl.name}?`, async () => {
    try {
      await correspondenceApi.deleteTemplate(tpl.id)
      await load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gagal menghapus template', 'Gagal')
    }
  })
}
</script>

<template>
  <section>
    <h1 class="mb-6 text-xl font-semibold text-slate-900">Klasifikasi &amp; Kode Surat</h1>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else>
      <!-- Master klasifikasi -->
      <div class="mb-8">
        <h2 class="mb-3 font-semibold text-slate-900">Master Klasifikasi</h2>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[42rem] border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-slate-500">
                <th class="py-2 pr-4">Jenis</th>
                <th class="py-2 pr-4">Kode Klasifikasi</th>
                <th class="py-2 pr-4">Nama Kategori/Urusan</th>
                <th class="py-2 pr-4">Masa Retensi Arsip</th>
                <th class="py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ref in references" :key="ref.id" class="border-b border-slate-100">
                <td class="py-2 pr-4 text-slate-500">{{ kindLabels[ref.kind] ?? ref.kind }}</td>
                <td class="py-2 pr-4 font-mono text-xs text-slate-900">{{ ref.code }}</td>
                <td class="py-2 pr-4 text-slate-700">{{ ref.name || '—' }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ retentionLabel(ref) }}</td>
                <td class="py-2 text-right">
                  <button v-if="canEdit" type="button" class="mr-2 text-xs text-brand-600 hover:underline" @click="editReference(ref)">Edit</button>
                  <button v-if="canEdit" type="button" class="text-xs text-red-600 hover:underline" @click="removeReference(ref)">Hapus</button>
                </td>
              </tr>
              <tr v-if="references.length === 0"><td colspan="5" class="py-3 text-slate-500">Belum ada klasifikasi.</td></tr>
            </tbody>
          </table>
        </div>

        <form v-if="canEdit" class="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4" @submit.prevent="saveReference">
          <select v-model="refForm.kind" :disabled="!!editingRefId" class="rounded border border-slate-300 px-3 py-2 text-sm">
            <option v-for="(label, value) in kindLabels" :key="value" :value="value">{{ label }}</option>
          </select>
          <input v-model="refForm.code" placeholder="Kode (mis. SK)" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="refForm.name" placeholder="Nama kategori/urusan" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="refForm.retention_years" type="number" min="0" placeholder="Masa retensi (tahun)" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <div class="flex gap-2 sm:col-span-4">
            <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
              {{ editingRefId ? 'Simpan Perubahan' : 'Tambah Klasifikasi' }}
            </button>
            <button v-if="editingRefId" type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="resetRefForm">Batal</button>
          </div>
        </form>
      </div>

      <!-- Template nomor -->
      <div>
        <h2 class="mb-3 font-semibold text-slate-900">Pengatur Format Nomor</h2>

        <ul class="mb-4 space-y-2 text-sm">
          <li v-for="tpl in templates" :key="tpl.id" class="flex flex-wrap items-center gap-2 rounded border border-slate-100 p-2">
            <span class="font-medium text-slate-900">{{ tpl.name }}</span>
            <span class="font-mono text-xs text-slate-500">{{ renderTemplatePreview(tpl.tokens) }}</span>
            <span v-if="tpl.is_active" class="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Aktif</span>
            <button v-if="canEdit && !tpl.is_active" type="button" class="text-xs text-brand-600 hover:underline" @click="activateTemplate(tpl.id)">Aktifkan</button>
            <button v-if="canEdit" type="button" class="text-xs text-brand-600 hover:underline" @click="editTemplate(tpl)">Edit</button>
            <button v-if="canEdit" type="button" class="text-xs text-red-600 hover:underline" @click="removeTemplate(tpl)">Hapus</button>
          </li>
          <li v-if="templates.length === 0" class="text-slate-500">Belum ada template.</li>
        </ul>

        <div v-if="canEdit" class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="mb-3 flex flex-wrap gap-2">
            <button
              v-for="v in TEMPLATE_VARIABLES"
              :key="v"
              type="button"
              draggable="true"
              class="cursor-grab rounded border border-slate-300 px-3 py-1.5 text-sm"
              @dragstart="onDragStart($event, v)"
              @click="addVariable(v)"
            >
              {{ '{' + v + '}' }}
            </button>
          </div>
          <div class="mb-3 flex flex-wrap gap-2">
            <input v-model="staticText" placeholder="Teks tetap (mis. B, /, UN5.1.1)" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="addText">Tambah Teks</button>
          </div>

          <div
            class="mb-2 flex min-h-[3rem] flex-wrap items-center gap-2 rounded-lg border-2 border-dashed p-3"
            :class="dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50'"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="onDrop"
          >
            <span v-if="tokens.length === 0" class="text-sm text-slate-400">Seret variabel ke sini untuk menyusun format nomor.</span>
            <button
              v-for="(t, i) in tokens"
              :key="i"
              type="button"
              class="rounded bg-slate-200 px-2 py-1 font-mono text-xs text-slate-700 hover:bg-slate-300"
              @click="removeToken(i)"
            >
              {{ t.type === 'variable' ? '{' + t.value + '}' : t.value }}
            </button>
          </div>

          <input v-model="tokenForm.name" placeholder="Nama template (mis. Format DPD)" class="mb-2 w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-72" />
          <p class="mb-3 text-sm text-slate-600">Pratinjau: <span class="font-mono text-slate-900">{{ preview }}</span></p>
          <div class="flex gap-2">
            <button type="button" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="saveTemplate">
              {{ editingTemplateId ? 'Simpan Perubahan' : 'Simpan Template' }}
            </button>
            <button v-if="editingTemplateId" type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="resetTemplate">Batal</button>
          </div>
        </div>
      </div>
    </template>

    <AppModal :open="modalMessage !== ''" :title="modalTitle" :message="modalMessage" @close="modalMessage = ''" />
    <AppModal
      :open="confirmMessage !== ''"
      variant="confirm"
      title="Konfirmasi"
      :message="confirmMessage"
      @close="confirmMessage = ''"
      @confirm="runConfirm"
    />
  </section>
</template>
