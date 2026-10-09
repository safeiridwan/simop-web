<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import SearchSelect from '@/components/SearchSelect.vue'
import { documentsApi } from '@/modules/documents/api'
import { downloadFile } from '@/services/http'
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
const editingAddressId = ref<string | null>(null)

const MAX_DOC_BYTES = 1 << 20
const docFile = ref<File | null>(null)
const editingDocumentId = ref<string | null>(null)
const editingFileId = ref<string | null>(null)

const toOptions = (regions: { id: string; name: string }[]) =>
  regions.map((r) => ({ value: r.id, label: r.name }))
const provinceOptions = computed(() => toOptions(provinces.value))
const cityOptions = computed(() => toOptions(cities.value))
const districtOptions = computed(() => toOptions(districts.value))
const villageOptions = computed(() => toOptions(villages.value))

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

function onProvinceChange(provinceId: string) {
  addressForm.city_id = ''
  addressForm.district_id = ''
  addressForm.village_id = ''
  loadCities(provinceId)
}

function onCityChange(cityId: string) {
  addressForm.district_id = ''
  addressForm.village_id = ''
  loadDistricts(cityId)
}

function onDistrictChange(districtId: string) {
  addressForm.village_id = ''
  loadVillages(districtId)
}

function resetAddressForm() {
  editingAddressId.value = null
  Object.assign(addressForm, {
    address_type: 'DOMICILE',
    address_line: '',
    province_id: '',
    city_id: '',
    district_id: '',
    village_id: '',
    postal_code: '',
    is_primary: false,
  })
  cities.value = []
  districts.value = []
  villages.value = []
}

async function startEditAddress(addr: Address) {
  editingAddressId.value = addr.id
  Object.assign(addressForm, {
    address_type: addr.address_type,
    address_line: addr.address_line ?? '',
    province_id: addr.province_id ?? '',
    city_id: addr.city_id ?? '',
    district_id: addr.district_id ?? '',
    village_id: addr.village_id ?? '',
    postal_code: addr.postal_code ?? '',
    is_primary: addr.is_primary,
  })
  if (addressForm.province_id) {
    await loadCities(addressForm.province_id)
    if (addressForm.city_id) {
      await loadDistricts(addressForm.city_id)
      if (addressForm.district_id) await loadVillages(addressForm.district_id)
    }
  }
}

async function submitAddress() {
  try {
    const payload = {
      ...addressForm,
      province_id: addressForm.province_id || null,
      city_id: addressForm.city_id || null,
      district_id: addressForm.district_id || null,
      village_id: addressForm.village_id || null,
    }
    if (editingAddressId.value) {
      await peopleApi.updateAddress(id, editingAddressId.value, payload)
    } else {
      await peopleApi.addAddress(id, payload)
    }
    resetAddressForm()
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan alamat'
  }
}

async function removeAddress(address: Address) {
  if (!window.confirm('Hapus alamat ini?')) return
  try {
    await peopleApi.deleteAddress(id, address.id)
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menghapus alamat'
  }
}

async function removeDocument(doc: PersonDocument) {
  if (!window.confirm('Hapus dokumen ini?')) return
  try {
    await peopleApi.deleteDocument(id, doc.id)
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menghapus dokumen'
  }
}

function resetDocForm() {
  editingDocumentId.value = null
  editingFileId.value = null
  docForm.document_type = ''
  docForm.document_number = ''
  docFile.value = null
}

function startEditDocument(doc: PersonDocument) {
  editingDocumentId.value = doc.id
  editingFileId.value = doc.file_id
  docForm.document_type = doc.document_type
  docForm.document_number = doc.document_number ?? ''
  docFile.value = null
}

function onDocFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (!file) {
    docFile.value = null
    return
  }
  if (file.type !== 'image/jpeg' && !/\.jpe?g$/i.test(file.name)) {
    error.value = 'Berkas dokumen harus berformat JPG/JPEG.'
    input.value = ''
    docFile.value = null
    return
  }
  if (file.size > MAX_DOC_BYTES) {
    error.value = 'Ukuran berkas maksimal 1 MB.'
    input.value = ''
    docFile.value = null
    return
  }
  docFile.value = file
}

async function submitDocument() {
  try {
    let fileId = editingFileId.value
    if (docFile.value) {
      const uploaded = await documentsApi.upload(docFile.value)
      fileId = uploaded.id
    }
    const payload = {
      document_type: docForm.document_type,
      document_number: docForm.document_number || null,
      file_id: fileId,
    }
    if (editingDocumentId.value) {
      await peopleApi.updateDocument(id, editingDocumentId.value, payload)
    } else {
      await peopleApi.addDocument(id, payload)
    }
    resetDocForm()
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan dokumen'
  }
}

async function downloadDocument(doc: PersonDocument) {
  if (!doc.file_id) return
  try {
    await downloadFile(`/api/v1/files/${doc.file_id}`, doc.document_type)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal mengunduh dokumen'
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
            <li v-for="addr in addresses" :key="addr.id" class="flex items-start justify-between gap-2 rounded border border-slate-200 bg-white p-3">
              <div>
                <p class="text-slate-900">{{ addr.address_line || '(tanpa alamat)' }}</p>
                <p class="text-slate-500">{{ addr.address_type }}<span v-if="addr.is_primary"> · utama</span></p>
              </div>
              <div class="flex shrink-0 gap-3">
                <button type="button" class="text-sm text-brand-600 hover:underline" @click="startEditAddress(addr)">
                  Ubah
                </button>
                <button type="button" class="text-sm text-red-600 hover:underline" @click="removeAddress(addr)">
                  Hapus
                </button>
              </div>
            </li>
            <li v-if="addresses.length === 0" class="text-slate-500">Belum ada alamat.</li>
          </ul>

          <form class="space-y-2 rounded border border-slate-200 bg-white p-3" @submit.prevent="submitAddress">
            <input v-model="addressForm.address_line" placeholder="Alamat" class="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            <SearchSelect
              v-model="addressForm.province_id"
              :options="provinceOptions"
              placeholder="Provinsi"
              @update:model-value="onProvinceChange($event)"
            />
            <SearchSelect
              v-model="addressForm.city_id"
              :options="cityOptions"
              placeholder="Kota/Kabupaten"
              @update:model-value="onCityChange($event)"
            />
            <SearchSelect
              v-model="addressForm.district_id"
              :options="districtOptions"
              placeholder="Kecamatan"
              @update:model-value="onDistrictChange($event)"
            />
            <SearchSelect v-model="addressForm.village_id" :options="villageOptions" placeholder="Kelurahan/Desa" />
            <label class="flex items-center gap-2 text-sm text-slate-600">
              <input v-model="addressForm.is_primary" type="checkbox" /> Alamat utama
            </label>
            <div class="flex gap-2">
              <button type="submit" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600">
                {{ editingAddressId ? 'Simpan Perubahan' : 'Tambah Alamat' }}
              </button>
              <button
                v-if="editingAddressId"
                type="button"
                class="rounded border border-slate-300 px-3 py-2 text-sm"
                @click="resetAddressForm"
              >
                Batal
              </button>
            </div>
          </form>
        </div>

        <div>
          <h2 class="mb-3 font-semibold text-slate-900">Dokumen</h2>
          <ul class="mb-4 space-y-2 text-sm">
            <li v-for="doc in documents" :key="doc.id" class="flex items-start justify-between gap-2 rounded border border-slate-200 bg-white p-3">
              <div>
                <p class="text-slate-900">{{ doc.document_type }}</p>
                <p class="text-slate-500">{{ doc.document_number || '—' }}</p>
              </div>
              <div class="flex shrink-0 gap-3">
                <button
                  v-if="doc.file_id"
                  type="button"
                  class="text-sm text-brand-600 hover:underline"
                  @click="downloadDocument(doc)"
                >
                  Unduh
                </button>
                <button type="button" class="text-sm text-brand-600 hover:underline" @click="startEditDocument(doc)">
                  Ubah
                </button>
                <button type="button" class="text-sm text-red-600 hover:underline" @click="removeDocument(doc)">
                  Hapus
                </button>
              </div>
            </li>
            <li v-if="documents.length === 0" class="text-slate-500">Belum ada dokumen.</li>
          </ul>

          <form class="space-y-2 rounded border border-slate-200 bg-white p-3" @submit.prevent="submitDocument">
            <input v-model="docForm.document_type" placeholder="Jenis dokumen (mis. KTP)" required class="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="docForm.document_number" placeholder="Nomor dokumen" class="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            <input
              type="file"
              accept="image/jpeg,image/jpg"
              class="w-full text-sm"
              @change="onDocFile"
            />
            <p class="text-xs text-slate-400">Berkas JPG/JPEG, maksimal 1 MB.</p>
            <div class="flex gap-2">
              <button type="submit" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600">
                {{ editingDocumentId ? 'Simpan Perubahan' : 'Tambah Dokumen' }}
              </button>
              <button
                v-if="editingDocumentId"
                type="button"
                class="rounded border border-slate-300 px-3 py-2 text-sm"
                @click="resetDocForm"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </template>
  </section>
</template>
