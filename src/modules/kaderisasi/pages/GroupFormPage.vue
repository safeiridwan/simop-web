<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppModal from '@/components/AppModal.vue'
import { kaderisasiApi, type CadreOption } from '../api'
import { GROUP_STATUSES, type GroupMemberRow, type Level } from '../types'
import CadrePicker from '../components/CadrePicker.vue'
import GroupMemberEditor from '../components/GroupMemberEditor.vue'

const router = useRouter()
const levels = ref<Level[]>([])
const submitting = ref(false)
const error = ref<string | null>(null)
const modalMessage = ref('')

const form = reactive({ name: '', murabbi_cadre_profile_id: '', level_id: '', status: 'ACTIVE', formed_at: '' })
const murabbiLabel = ref('')
const members = ref<GroupMemberRow[]>([])

const memberIds = computed(() => members.value.map((m) => m.cadre_profile_id).filter(Boolean))

onMounted(async () => {
  try {
    levels.value = await kaderisasiApi.levels()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat jenjang'
  }
})

function onMurabbiSelect(option: CadreOption) {
  murabbiLabel.value = `${option.person_code} - ${option.full_name}`
}

function validate(): string | null {
  const missing: string[] = []
  if (!form.name.trim()) missing.push('Nama Grup')
  if (!form.murabbi_cadre_profile_id) missing.push('Murabbi')
  if (!form.level_id) missing.push('Jenjang')
  if (!form.status) missing.push('Status')
  if (!form.formed_at) missing.push('Tanggal Terbentuk')
  if (missing.length > 0) {
    return `Field berikut wajib diisi: ${missing.join(', ')}.`
  }
  if (memberIds.value.includes(form.murabbi_cadre_profile_id)) {
    return 'Murabbi tidak boleh menjadi anggota grup yang dibinanya.'
  }
  if (new Set(memberIds.value).size !== memberIds.value.length) {
    return 'Satu kader tidak boleh muncul lebih dari sekali dalam satu grup.'
  }
  return null
}

async function submit() {
  const validation = validate()
  if (validation) {
    modalMessage.value = validation
    return
  }
  submitting.value = true
  error.value = null
  try {
    const created = await kaderisasiApi.createGroup({
      name: form.name,
      murabbi_cadre_profile_id: form.murabbi_cadre_profile_id,
      level_id: form.level_id,
      status: form.status,
      formed_at: form.formed_at,
      member_ids: memberIds.value,
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

    <form class="space-y-6" @submit.prevent="submit">
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Header</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700" for="g-name">Nama Grup</label>
            <input id="g-name" v-model="form.name" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">Murabbi</label>
            <div class="mt-1">
              <CadrePicker
                v-model="form.murabbi_cadre_profile_id"
                :exclude-ids="memberIds"
                :initial-label="murabbiLabel"
                :disabled="submitting"
                @select="onMurabbiSelect"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="g-level">Jenjang</label>
            <select id="g-level" v-model="form.level_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="" disabled>Pilih jenjang</option>
              <option v-for="l in levels" :key="l.id" :value="l.id">{{ l.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="g-status">Status</label>
            <select id="g-status" v-model="form.status" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="" disabled>Pilih status</option>
              <option v-for="s in GROUP_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="g-formed">Tanggal Terbentuk</label>
            <input id="g-formed" v-model="form.formed_at" type="date" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Detail Anggota</h2>
        <GroupMemberEditor
          v-model="members"
          :murabbi-id="form.murabbi_cadre_profile_id"
          :disabled="submitting"
        />
      </div>

      <button type="submit" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <AppModal :open="modalMessage !== ''" title="Data Belum Lengkap" :message="modalMessage" @close="modalMessage = ''" />
  </section>
</template>
