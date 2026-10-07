<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

import { peopleApi } from '../api'
import type { Person, PersonInput } from '../types'

const props = withDefaults(
  defineProps<{
    initial?: Partial<PersonInput>
    submitLabel?: string
    submitting?: boolean
    duplicateCheck?: boolean
  }>(),
  { submitLabel: 'Simpan', submitting: false, duplicateCheck: false },
)

const emit = defineEmits<{ submit: [PersonInput] }>()

const form = reactive<PersonInput>({
  full_name: props.initial?.full_name ?? '',
  nik: props.initial?.nik ?? '',
  gender: props.initial?.gender ?? 'UNKNOWN',
  birth_place: props.initial?.birth_place ?? '',
  birth_date: props.initial?.birth_date ?? '',
  phone: props.initial?.phone ?? '',
  email: props.initial?.email ?? '',
  status: props.initial?.status ?? 'ACTIVE',
})

const duplicate = ref<Person | null>(null)

async function checkDuplicate() {
  if (!props.duplicateCheck || !form.nik) return
  try {
    const matches = await peopleApi.searchByNIK(form.nik)
    duplicate.value = matches.length ? matches[0] : null
  } catch {
    duplicate.value = null
  }
}

watch(() => form.nik, checkDuplicate)

function onSubmit() {
  emit('submit', { ...form })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <p v-if="duplicate" class="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
      Peringatan: NIK ini sudah terdaftar sebagai
      <strong>{{ duplicate.full_name }}</strong> ({{ duplicate.person_code }}).
    </p>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700" for="p-name">Nama Lengkap</label>
        <input id="p-name" v-model="form.full_name" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-nik">NIK</label>
        <input id="p-nik" v-model="form.nik" maxlength="16" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-gender">Jenis Kelamin</label>
        <select id="p-gender" v-model="form.gender" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="UNKNOWN">Tidak diketahui</option>
          <option value="MALE">Laki-laki</option>
          <option value="FEMALE">Perempuan</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-birth-place">Tempat Lahir</label>
        <input id="p-birth-place" v-model="form.birth_place" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-birth-date">Tanggal Lahir</label>
        <input id="p-birth-date" v-model="form.birth_date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-phone">Telepon</label>
        <input id="p-phone" v-model="form.phone" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-email">Email</label>
        <input id="p-email" v-model="form.email" type="email" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="p-status">Status</label>
        <select id="p-status" v-model="form.status" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Tidak aktif</option>
          <option value="DECEASED">Meninggal</option>
        </select>
      </div>
    </div>

    <button
      type="submit"
      :disabled="submitting"
      class="rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
    >
      {{ submitting ? 'Menyimpan...' : submitLabel }}
    </button>
  </form>
</template>
