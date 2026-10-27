<script setup lang="ts">
import { onMounted, ref } from 'vue'

import FilterDateRange from '@/components/FilterDateRange.vue'
import FilterSelect from '@/components/FilterSelect.vue'
import FilterTextInput from '@/components/FilterTextInput.vue'
import ImportPanel from '@/components/ImportPanel.vue'
import Pagination from '@/components/Pagination.vue'
import SortableTh from '@/components/SortableTh.vue'
import PersonPicker from '@/components/PersonPicker.vue'
import type { Person } from '@/modules/people/types'
import { downloadFile } from '@/services/http'
import { formatDate } from '@/utils/date'
import { membersApi } from '../api'
import { useMembers } from '../composables/useMembers'
import { useSort } from '@/composables/useSort'
import { MEMBER_STATUSES, memberStatusLabel, type CreateMemberInput, type ImportResult } from '../types'

const { members, meta, loading, error, load } = useMembers()

const fullName = ref('')
const memberNumber = ref('')
const city = ref('')
const district = ref('')
const village = ref('')
const status = ref('')
const joinFrom = ref('')
const joinTo = ref('')
const page = ref(1)
const pageSize = ref(10)
const { sort, direction, toggle } = useSort()
const showForm = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)

const selectedPerson = ref<Person | null>(null)
const joinDate = ref('')
const source = ref('')

const showImport = ref(false)
const importing = ref(false)
const importError = ref<string | null>(null)
const importResult = ref<ImportResult | null>(null)

function currentQuery() {
  return {
    fullName: fullName.value,
    memberNumber: memberNumber.value,
    city: city.value,
    district: district.value,
    village: village.value,
    status: status.value,
    joinFrom: joinFrom.value,
    joinTo: joinTo.value,
    page: page.value,
    pageSize: pageSize.value,
    sort: sort.value,
    direction: direction.value,
  }
}

function onSort(field: string) {
  toggle(field)
  page.value = 1
  void load(currentQuery())
}

onMounted(() => void load())

async function onImport(file: File) {
  importing.value = true
  importError.value = null
  importResult.value = null
  try {
    importResult.value = await membersApi.import(file)
    await load(currentQuery())
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Gagal mengimpor'
  } finally {
    importing.value = false
  }
}

function onFilter() {
  page.value = 1
  void load(currentQuery())
}

function onPageChange(target: number) {
  page.value = target
  void load(currentQuery())
}

function onPageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  void load(currentQuery())
}

async function onExport() {
  try {
    await downloadFile(membersApi.exportUrl(currentQuery()), 'members.csv')
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
    await load(currentQuery())
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
        <h1 class="text-xl font-semibold text-slate-900">Anggota Partai</h1>
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
          class="rounded border border-slate-300 px-3 py-2 text-sm"
          @click="showImport = !showImport"
        >
          {{ showImport ? 'Tutup Impor' : 'Impor' }}
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

    <ImportPanel
      v-if="showImport"
      template-path="/api/v1/members/import/template"
      template-filename="template-anggota"
      :busy="importing"
      :result="importResult"
      :error="importError"
      @import="onImport"
    />

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

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[58rem] border-collapse text-sm">
        <thead class="sticky top-0 z-10 bg-white">
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <SortableTh field="member_number" label="No. Anggota" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="full_name" label="Nama" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="city_name" label="Kabupaten/Kota" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="district_name" label="Kecamatan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="village_name" label="Kelurahan" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="status" label="Status" :active="sort" :direction="direction" @sort="onSort" />
            <SortableTh field="join_date" label="Tgl Gabung" :active="sort" :direction="direction" @sort="onSort" />
          </tr>
          <tr class="border-b border-slate-200">
            <th class="pb-2 pr-4"><FilterTextInput v-model="memberNumber" label="Filter nomor anggota" placeholder="Cari nomor" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="fullName" label="Filter nama" placeholder="Cari nama" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="city" label="Filter kabupaten/kota" placeholder="Cari kab/kota" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="district" label="Filter kecamatan" placeholder="Cari kecamatan" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4"><FilterTextInput v-model="village" label="Filter kelurahan" placeholder="Cari kelurahan" @update:model-value="onFilter" /></th>
            <th class="pb-2 pr-4">
              <FilterSelect
                v-model="status"
                label="Filter status"
                all-label="Semua status"
                :options="MEMBER_STATUSES"
                @change="onFilter"
              />
            </th>
            <th class="pb-2"><FilterDateRange v-model:from="joinFrom" v-model:to="joinTo" label="Filter tanggal gabung" @change="onFilter" /></th>
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
            <td class="py-2 pr-4 text-slate-600">{{ member.city_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ member.district_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ member.village_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ memberStatusLabel(member.status) }}</td>
            <td class="py-2 text-slate-600">{{ member.join_date ? formatDate(member.join_date) : '—' }}</td>
          </tr>
          <tr v-if="members.length === 0"><td colspan="7" class="py-3 text-slate-500">Belum ada data.</td></tr>
        </tbody>
      </table>
    </div>

    <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
  </section>
</template>
