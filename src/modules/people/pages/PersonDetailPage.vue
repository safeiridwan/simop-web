<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { peopleApi } from '../api'
import { useRegions } from '../composables/useRegions'
import type { Address, Person, PersonDocument } from '../types'

const route = useRoute()
const id = route.params.id as string

const person = ref<Person | null>(null)
const addresses = ref<Address[]>([])
const documents = ref<PersonDocument[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const { provinces, cities, districts, villages, loadProvinces, loadCities, loadDistricts, loadVillages } = useRegions()

const addressForm = reactive({
  address_type: 'DOMICILE',
  address_line: '',
  province_id: '',
  city_id: '',
  district_id: '',
  village_id: '',
  postal_code: '',
  is_primary: false,
})
const docForm = reactive({ document_type: '', document_number: '' })

async function refresh() {
  loading.value = true
  try {
    person.value = await peopleApi.get(id)
    addresses.value = await peopleApi.listAddresses(id)
    documents.value = await peopleApi.listDocuments(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await refresh()
  await loadProvinces()
})

async function addAddress() {
  try {
    await peopleApi.addAddress(id, {
      ...addressForm,
      province_id: addressForm.province_id || null,
      city_id: addressForm.city_id || null,
      district_id: addressForm.district_id || null,
      village_id: addressForm.village_id || null,
    })
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menambah alamat'
  }
}

async function addDocument() {
  try {
    await peopleApi.addDocument(id, { ...docForm })
    docForm.document_type = ''
    docForm.document_number = ''
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menambah dokumen'
  }
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="person">
      <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-xl font-semibold text-slate-900">{{ person.full_name }}</h1>
          <p class="font-mono text-xs text-slate-500">{{ person.person_code }}</p>
        </div>
        <router-link :to="`/people/${person.id}/edit`" class="rounded border border-slate-300 px-3 py-2 text-center text-sm sm:w-fit">
          Ubah
        </router-link>
      </header>

      <dl class="mb-8 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div><dt class="text-slate-500">NIK</dt><dd class="text-slate-900">{{ person.nik_masked || '—' }}</dd></div>
        <div><dt class="text-slate-500">Telepon</dt><dd class="text-slate-900">{{ person.phone_masked || '—' }}</dd></div>
        <div><dt class="text-slate-500">Jenis Kelamin</dt><dd class="text-slate-900">{{ person.gender }}</dd></div>
        <div><dt class="text-slate-500">Tempat/Tgl Lahir</dt><dd class="text-slate-900">{{ person.birth_place || '—' }} {{ person.birth_date || '' }}</dd></div>
        <div><dt class="text-slate-500">Email</dt><dd class="text-slate-900">{{ person.email || '—' }}</dd></div>
        <div><dt class="text-slate-500">Status</dt><dd class="text-slate-900">{{ person.status }}</dd></div>
      </dl>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 class="mb-3 font-semibold text-slate-900">Alamat</h2>
          <ul class="mb-4 space-y-2 text-sm">
            <li v-for="addr in addresses" :key="addr.id" class="rounded border border-slate-200 bg-white p-3">
              <p class="text-slate-900">{{ addr.address_line || '(tanpa alamat)' }}</p>
              <p class="text-slate-500">{{ addr.address_type }}<span v-if="addr.is_primary"> · utama</span></p>
            </li>
            <li v-if="addresses.length === 0" class="text-slate-500">Belum ada alamat.</li>
          </ul>

          <form class="space-y-2 rounded border border-slate-200 bg-white p-3" @submit.prevent="addAddress">
            <input v-model="addressForm.address_line" placeholder="Alamat" class="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            <select v-model="addressForm.province_id" class="w-full rounded border border-slate-300 px-3 py-2 text-sm" @change="loadCities(addressForm.province_id)">
              <option value="">Provinsi</option>
              <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <select v-model="addressForm.city_id" class="w-full rounded border border-slate-300 px-3 py-2 text-sm" @change="loadDistricts(addressForm.city_id)">
              <option value="">Kota/Kabupaten</option>
              <option v-for="c in cities" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <select v-model="addressForm.district_id" class="w-full rounded border border-slate-300 px-3 py-2 text-sm" @change="loadVillages(addressForm.district_id)">
              <option value="">Kecamatan</option>
              <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
            <select v-model="addressForm.village_id" class="w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">Kelurahan/Desa</option>
              <option v-for="v in villages" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
            <label class="flex items-center gap-2 text-sm text-slate-600">
              <input v-model="addressForm.is_primary" type="checkbox" /> Alamat utama
            </label>
            <button type="submit" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600">
              Tambah Alamat
            </button>
          </form>
        </div>

        <div>
          <h2 class="mb-3 font-semibold text-slate-900">Dokumen</h2>
          <ul class="mb-4 space-y-2 text-sm">
            <li v-for="doc in documents" :key="doc.id" class="rounded border border-slate-200 bg-white p-3">
              <p class="text-slate-900">{{ doc.document_type }}</p>
              <p class="text-slate-500">{{ doc.document_number || '—' }}</p>
            </li>
            <li v-if="documents.length === 0" class="text-slate-500">Belum ada dokumen.</li>
          </ul>

          <form class="space-y-2 rounded border border-slate-200 bg-white p-3" @submit.prevent="addDocument">
            <input v-model="docForm.document_type" placeholder="Jenis dokumen (mis. KTP)" required class="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="docForm.document_number" placeholder="Nomor dokumen" class="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600">
              Tambah Dokumen
            </button>
          </form>
        </div>
      </div>
    </template>
  </section>
</template>
