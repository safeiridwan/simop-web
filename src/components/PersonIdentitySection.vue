<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import AppModal from '@/components/AppModal.vue'
import FileDropzone from '@/components/FileDropzone.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import { useRegions } from '@/modules/people/composables/useRegions'
import type { Address, Person, PersonDocument } from '@/modules/people/types'
import { MAX_DOCUMENT_BYTES, type PersonIdentityForm } from '@/composables/usePersonIdentity'
import { downloadFile } from '@/services/http'
import { formatDate } from '@/utils/date'

const props = withDefaults(
  defineProps<{
    person: Person | null
    address: Address | null
    documents: PersonDocument[]
    editing: boolean
    disabled?: boolean
  }>(),
  { disabled: false },
)

const identity = defineModel<PersonIdentityForm>('form', { required: true })

const emit = defineEmits<{
  addDocument: [file: File, documentType: string, documentNumber: string]
  removeDocument: [documentId: string]
}>()

const { provinces, cities, districts, villages, loadProvinces, loadCities, loadDistricts, loadVillages } = useRegions()
const names = reactive({ city: '', district: '', village: '' })

const provinceOptions = computed(() => provinces.value.map((r) => ({ value: r.id, label: r.name })))
const cityOptions = computed(() => cities.value.map((r) => ({ value: r.id, label: r.name })))
const districtOptions = computed(() => districts.value.map((r) => ({ value: r.id, label: r.name })))
const villageOptions = computed(() => villages.value.map((r) => ({ value: r.id, label: r.name })))

const GENDERS = [
  { value: 'MALE', label: 'Laki-laki' },
  { value: 'FEMALE', label: 'Perempuan' },
  { value: 'UNKNOWN', label: 'Tidak diketahui' },
]

function genderLabel(value: string): string {
  return GENDERS.find((g) => g.value === value)?.label ?? value
}

async function resolveNames(address: Address | null) {
  names.city = ''
  names.district = ''
  names.village = ''
  if (!address?.province_id) return
  await loadCities(address.province_id)
  names.city = cities.value.find((c) => c.id === address.city_id)?.name ?? ''
  if (!address.city_id) return
  await loadDistricts(address.city_id)
  names.district = districts.value.find((d) => d.id === address.district_id)?.name ?? ''
  if (!address.district_id) return
  await loadVillages(address.district_id)
  names.village = villages.value.find((v) => v.id === address.village_id)?.name ?? ''
}

async function cascadeFromForm() {
  if (identity.value.province_id) await loadCities(identity.value.province_id)
  if (identity.value.city_id) await loadDistricts(identity.value.city_id)
  if (identity.value.district_id) await loadVillages(identity.value.district_id)
}

async function onProvinceChange(value: string) {
  identity.value.city_id = ''
  identity.value.district_id = ''
  identity.value.village_id = ''
  if (value) await loadCities(value)
  else {
    cities.value = []
    districts.value = []
    villages.value = []
  }
}

async function onCityChange(value: string) {
  identity.value.district_id = ''
  identity.value.village_id = ''
  if (value) await loadDistricts(value)
  else {
    districts.value = []
    villages.value = []
  }
}

async function onDistrictChange(value: string) {
  identity.value.village_id = ''
  if (value) await loadVillages(value)
  else villages.value = []
}

onMounted(async () => {
  await loadProvinces()
  if (props.editing) await cascadeFromForm()
  else await resolveNames(props.address)
})

watch(
  () => props.address,
  (address) => {
    if (!props.editing) void resolveNames(address)
  },
)

watch(
  () => props.editing,
  async (editing) => {
    if (editing) await cascadeFromForm()
    else await resolveNames(props.address)
  },
)

// --- Dokumen ---
const docType = ref('')
const docNumber = ref('')
const docFile = ref<File | null>(null)
const docError = ref<string | null>(null)
const pendingDelete = ref<PersonDocument | null>(null)

function onFile(file: File | null) {
  docFile.value = file
  docError.value = null
}

function addDocument() {
  if (!docType.value.trim()) {
    docError.value = 'Jenis dokumen wajib diisi.'
    return
  }
  if (!docFile.value) {
    docError.value = 'Pilih berkas dokumen terlebih dahulu.'
    return
  }
  emit('addDocument', docFile.value, docType.value.trim(), docNumber.value.trim())
  docType.value = ''
  docNumber.value = ''
  docFile.value = null
}

async function download(doc: PersonDocument) {
  if (!doc.file_id) return
  try {
    await downloadFile(`/api/v1/files/${doc.file_id}`, doc.document_type)
  } catch {
    docError.value = 'Gagal mengunduh dokumen.'
  }
}

function confirmRemove() {
  if (!pendingDelete.value) return
  emit('removeDocument', pendingDelete.value.id)
  pendingDelete.value = null
}
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-4">
    <h2 class="mb-3 font-semibold text-slate-900">Detail Identitas</h2>

    <div v-if="!editing" class="space-y-4 text-sm">
      <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><dt class="text-slate-500">Nama Lengkap</dt><dd class="text-slate-900">{{ person?.full_name ?? '—' }}</dd></div>
        <div><dt class="text-slate-500">NIK</dt><dd class="font-mono text-slate-900">{{ person?.nik_masked || '—' }}</dd></div>
        <div><dt class="text-slate-500">Jenis Kelamin</dt><dd class="text-slate-900">{{ genderLabel(person?.gender ?? '') }}</dd></div>
        <div><dt class="text-slate-500">Tempat Lahir</dt><dd class="text-slate-900">{{ person?.birth_place || '—' }}</dd></div>
        <div><dt class="text-slate-500">Tanggal Lahir</dt><dd class="text-slate-900">{{ person?.birth_date ? formatDate(person.birth_date) : '—' }}</dd></div>
        <div><dt class="text-slate-500">Telepon</dt><dd class="font-mono text-slate-900">{{ person?.phone_masked || '—' }}</dd></div>
        <div><dt class="text-slate-500">Email</dt><dd class="text-slate-900">{{ person?.email || '—' }}</dd></div>
        <div class="sm:col-span-2">
          <dt class="text-slate-500">Alamat</dt>
          <dd class="text-slate-900">
            {{ address?.address_line || '—' }}
            <span class="block text-slate-600">
              {{ [names.village, names.district, names.city].filter(Boolean).join(', ') || '—' }}
            </span>
          </dd>
        </div>
      </dl>

      <div>
        <h3 class="mb-2 text-sm font-medium text-slate-700">Dokumen</h3>
        <ul class="space-y-2">
          <li
            v-for="doc in documents"
            :key="doc.id"
            class="flex items-center justify-between gap-2 rounded border border-slate-200 p-2"
          >
            <span class="text-slate-900">
              {{ doc.document_type }}
              <span v-if="doc.document_number" class="text-slate-500">· {{ doc.document_number }}</span>
            </span>
            <button v-if="doc.file_id" type="button" class="text-sm text-brand-600 hover:underline" @click="download(doc)">
              Unduh
            </button>
          </li>
          <li v-if="documents.length === 0" class="text-slate-500">Belum ada dokumen.</li>
        </ul>
      </div>
    </div>

    <form v-else class="space-y-4" @submit.prevent>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-slate-700" for="pi-name">Nama Lengkap</label>
          <input id="pi-name" v-model="identity.full_name" :disabled="disabled" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700" for="pi-nik">NIK</label>
          <input id="pi-nik" v-model="identity.nik" maxlength="16" :disabled="disabled" placeholder="Kosongkan bila tidak diubah" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700" for="pi-gender">Jenis Kelamin</label>
          <select id="pi-gender" v-model="identity.gender" :disabled="disabled" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
            <option v-for="g in GENDERS" :key="g.value" :value="g.value">{{ g.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700" for="pi-birth-place">Tempat Lahir</label>
          <input id="pi-birth-place" v-model="identity.birth_place" :disabled="disabled" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700" for="pi-birth-date">Tanggal Lahir</label>
          <input id="pi-birth-date" v-model="identity.birth_date" type="date" :disabled="disabled" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700" for="pi-phone">Telepon</label>
          <input id="pi-phone" v-model="identity.phone" :disabled="disabled" placeholder="Kosongkan bila tidak diubah" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700" for="pi-email">Email</label>
          <input id="pi-email" v-model="identity.email" type="email" :disabled="disabled" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-slate-700" for="pi-address">Alamat</label>
          <input id="pi-address" v-model="identity.address_line" :disabled="disabled" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Kabupaten/Kota</label>
          <div class="mt-1">
            <SearchSelect :model-value="identity.province_id" :options="provinceOptions" placeholder="Provinsi" :disabled="disabled" @update:model-value="onProvinceChange" />
          </div>
          <div class="mt-1">
            <SearchSelect v-model="identity.city_id" :options="cityOptions" placeholder="Kabupaten/Kota" :disabled="disabled" @update:model-value="onCityChange" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Kecamatan / Kelurahan</label>
          <div class="mt-1">
            <SearchSelect v-model="identity.district_id" :options="districtOptions" placeholder="Kecamatan" :disabled="disabled" @update:model-value="onDistrictChange" />
          </div>
          <div class="mt-1">
            <SearchSelect v-model="identity.village_id" :options="villageOptions" placeholder="Kelurahan/Desa" :disabled="disabled" />
          </div>
        </div>
      </div>

      <div>
        <h3 class="mb-2 text-sm font-medium text-slate-700">Dokumen</h3>
        <ul class="mb-3 space-y-2">
          <li
            v-for="doc in documents"
            :key="doc.id"
            class="flex items-center justify-between gap-2 rounded border border-slate-200 p-2 text-sm"
          >
            <span class="text-slate-900">
              {{ doc.document_type }}
              <span v-if="doc.document_number" class="text-slate-500">· {{ doc.document_number }}</span>
            </span>
            <span class="flex gap-3">
              <button v-if="doc.file_id" type="button" class="text-brand-600 hover:underline" @click="download(doc)">Unduh</button>
              <button type="button" class="text-red-600 hover:underline" @click="pendingDelete = doc">Hapus</button>
            </span>
          </li>
          <li v-if="documents.length === 0" class="text-sm text-slate-500">Belum ada dokumen.</li>
        </ul>

        <div class="grid gap-2 sm:grid-cols-2">
          <input v-model="docType" placeholder="Jenis dokumen (mis. KTP)" :disabled="disabled" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="docNumber" placeholder="Nomor dokumen" :disabled="disabled" class="rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <FileDropzone
          class="mt-2"
          label="Seret & lepas berkas JPG/JPEG (maks. 1 MB)"
          accept="image/jpeg"
          :allowed-types="['image/jpeg']"
          :max-bytes="MAX_DOCUMENT_BYTES"
          :disabled="disabled"
          @update:file="onFile"
        />
        <p v-if="docError" class="mt-1 text-sm text-red-600">{{ docError }}</p>
        <button type="button" :disabled="disabled" class="mt-2 rounded border border-slate-300 px-3 py-2 text-sm" @click="addDocument">
          Tambah Dokumen
        </button>
      </div>
    </form>

    <AppModal
      :open="pendingDelete !== null"
      variant="confirm"
      title="Konfirmasi"
      :message="`Hapus dokumen ${pendingDelete?.document_type ?? ''}?`"
      @close="pendingDelete = null"
      @confirm="confirmRemove"
    />
  </section>
</template>
