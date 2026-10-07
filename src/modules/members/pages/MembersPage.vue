<script setup lang="ts">
import { onMounted, ref } from 'vue'

import PersonPicker from '@/components/PersonPicker.vue'
import type { Person } from '@/modules/people/types'
import { downloadFile } from '@/services/http'
import { membersApi } from '../api'
import { useMembers } from '../composables/useMembers'
import { MEMBER_STATUSES, memberStatusLabel, type CreateMemberInput } from '../types'

const { members, meta, loading, error, load } = useMembers()

const search = ref('')
const status = ref('')
const showForm = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)

const selectedPerson = ref<Person | null>(null)
const joinDate = ref('')
const source = ref('')

onMounted(() => void load())

function onFilter() {
  void load(search.value, status.value)
}

async function onExport() {
  try {
    await downloadFile(membersApi.exportUrl, 'members.csv')
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Gagal mengekspor'
  }
}

async function submit() {
  if (!selectedPerson.value) {
    formError.value = 'Pilih orang terlebih dahulu.'
    return
  }
  submitting.value = true
  formError.value = null
  try {
    const input: CreateMemberInput = { person_id: selectedPerson.value.id }
    if (joinDate.value) input.join_date = joinDate.value
    if (source.value) input.membership_source = source.value
    await membersApi.create(input)
    showForm.value = false
    selectedPerson.value = null
    joinDate.value = ''
    source.value = ''
    await load(search.value, status.value)
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Gagal menambah anggota'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Anggota</h1>
        <p v-if="meta" class="text-sm text-slate-500">{{ meta.total }} anggota</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded border border-slate-300 px-3 py-2 text-sm"
          @click="onExport"
        >
          Ekspor CSV
        </button>
        <button
          type="button"
          class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          @click="showForm = !showForm"
        >
          {{ showForm ? 'Batal' : 'Tambah Anggota' }}
        </button>
      </div>
    </header>

    <form v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" @submit.prevent="submit">
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700">Orang</label>
        <PersonPicker v-model="selectedPerson" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="m-join">Tanggal Gabung</label>
        <input id="m-join" v-model="joinDate" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="m-source">Sumber</label>
        <input id="m-source" v-model="source" placeholder="mis. REKRUTMEN" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <p v-if="formError" class="text-sm text-red-600 sm:col-span-2">{{ formError }}</p>
      <button
        type="submit"
        :disabled="submitting"
        class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit"
      >
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <div class="mb-4 flex flex-wrap gap-2">
      <input
        v-model="search"
        placeholder="Cari nama atau nomor anggota"
        class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64"
        @keyup.enter="onFilter"
      />
      <select v-model="status" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="onFilter">
        <option value="">Semua status</option>
        <option v-for="s in MEMBER_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onFilter">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="members.length === 0" class="text-sm text-slate-500">Belum ada anggota.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">No. Anggota</th>
            <th class="py-2 pr-4">Nama</th>
            <th class="py-2 pr-4">Status</th>
            <th class="py-2">Tgl Gabung</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 font-mono text-xs text-slate-500">{{ member.member_number }}</td>
            <td class="py-2 pr-4">
              <router-link :to="`/members/${member.id}`" class="text-brand-600 hover:underline">
                {{ member.full_name }}
              </router-link>
            </td>
            <td class="py-2 pr-4 text-slate-600">{{ memberStatusLabel(member.status) }}</td>
            <td class="py-2 text-slate-600">{{ member.join_date || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
