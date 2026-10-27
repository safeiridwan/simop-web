import { ref } from 'vue'

import { documentsApi } from '@/modules/documents/api'
import { peopleApi } from '@/modules/people/api'
import type { Address, Person, PersonDocument } from '@/modules/people/types'

/** Editable identity fields shared by the Kader and Non-Kader detail pages. */
export interface PersonIdentityForm {
  full_name: string
  nik: string
  gender: string
  birth_place: string
  birth_date: string
  phone: string
  email: string
  status: string
  address_line: string
  province_id: string
  city_id: string
  district_id: string
  village_id: string
  postal_code: string
}

export const MAX_DOCUMENT_BYTES = 1 << 20

export function emptyIdentityForm(): PersonIdentityForm {
  return {
    full_name: '',
    nik: '',
    gender: 'UNKNOWN',
    birth_place: '',
    birth_date: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
    address_line: '',
    province_id: '',
    city_id: '',
    district_id: '',
    village_id: '',
    postal_code: '',
  }
}

export function formFromPerson(person: Person | null, address: Address | null): PersonIdentityForm {
  const form = emptyIdentityForm()
  if (person) {
    form.full_name = person.full_name ?? ''
    form.gender = person.gender || 'UNKNOWN'
    form.birth_place = person.birth_place ?? ''
    form.birth_date = person.birth_date ?? ''
    form.email = person.email ?? ''
    form.status = person.status || 'ACTIVE'
  }
  if (address) {
    form.address_line = address.address_line ?? ''
    form.province_id = address.province_id ?? ''
    form.city_id = address.city_id ?? ''
    form.district_id = address.district_id ?? ''
    form.village_id = address.village_id ?? ''
    form.postal_code = address.postal_code ?? ''
  }
  return form
}

/**
 * Person identity payload. Blank NIK/phone are omitted so the backend keeps the
 * stored value (the masked value is never re-sent as plaintext).
 */
export interface PersonIdentityPayload {
  full_name: string
  gender: string
  birth_place: string
  birth_date: string
  email: string
  status: string
  nik?: string
  phone?: string
  address: {
    address_line: string | null
    province_id: string | null
    city_id: string | null
    district_id: string | null
    village_id: string | null
    postal_code: string | null
  }
}

export function toPersonPayload(form: PersonIdentityForm): PersonIdentityPayload {
  const payload: PersonIdentityPayload = {
    full_name: form.full_name.trim(),
    gender: form.gender,
    birth_place: form.birth_place,
    birth_date: form.birth_date,
    email: form.email,
    status: form.status,
    address: {
      address_line: form.address_line || null,
      province_id: form.province_id || null,
      city_id: form.city_id || null,
      district_id: form.district_id || null,
      village_id: form.village_id || null,
      postal_code: form.postal_code || null,
    },
  }
  if (form.nik.trim()) payload.nik = form.nik.trim()
  if (form.phone.trim()) payload.phone = form.phone.trim()
  return payload
}

export function usePersonIdentity(personId: () => string) {
  const person = ref<Person | null>(null)
  const address = ref<Address | null>(null)
  const documents = ref<PersonDocument[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    const id = personId()
    if (!id) return
    loading.value = true
    error.value = null
    try {
      const [p, addresses, docs] = await Promise.all([
        peopleApi.get(id),
        peopleApi.listAddresses(id),
        peopleApi.listDocuments(id),
      ])
      person.value = p
      address.value = addresses.find((a) => a.is_primary) ?? addresses[0] ?? null
      documents.value = docs
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat identitas'
    } finally {
      loading.value = false
    }
  }

  async function addDocument(file: File, documentType: string, documentNumber: string): Promise<void> {
    const uploaded = await documentsApi.upload(file)
    await peopleApi.addDocument(personId(), {
      document_type: documentType,
      document_number: documentNumber || null,
      file_id: uploaded.id,
    })
    await load()
  }

  async function removeDocument(documentId: string): Promise<void> {
    await peopleApi.deleteDocument(personId(), documentId)
    await load()
  }

  return { person, address, documents, loading, error, load, addDocument, removeDocument }
}
