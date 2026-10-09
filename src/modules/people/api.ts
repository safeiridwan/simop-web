import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost, downloadFile, getAccessToken } from '@/services/http'
import type {
  Address,
  AddressInput,
  DocumentInput,
  ImportResult,
  PageMeta,
  Person,
  PersonDocument,
  PersonInput,
  Region,
} from './types'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export interface ListPeopleQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  gender?: string
}

export const peopleApi = {
  list: (query: ListPeopleQuery = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.pageSize ?? 20))
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
    if (query.gender) params.set('gender', query.gender)
    return apiGetPage<Person[], PageMeta>(`/api/v1/persons?${params.toString()}`)
  },
  get: (id: string) => apiGet<Person>(`/api/v1/persons/${id}`),
  create: (input: PersonInput) => apiPost<Person>('/api/v1/persons', input),
  update: (id: string, input: Partial<PersonInput>) => apiPatch<Person>(`/api/v1/persons/${id}`, input),
  remove: (id: string) => apiDelete<{ status: string }>(`/api/v1/persons/${id}`),
  searchByNIK: (nik: string) =>
    apiGet<Person[]>(`/api/v1/persons/search?nik=${encodeURIComponent(nik)}`),
  importTemplate: (format: 'csv' | 'xlsx') =>
    downloadFile(`/api/v1/persons/import/template?format=${format}`, `template-orang.${format}`),
  importPeople: async (file: File): Promise<ImportResult> => {
    const form = new FormData()
    form.append('file', file)
    const headers: Record<string, string> = { Accept: 'application/json' }
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${baseUrl}/api/v1/persons/import`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: form,
    })
    const body = (await res.json()) as { data: ImportResult; error?: { message?: string } }
    if (!res.ok) throw new Error(body.error?.message ?? 'Impor gagal')
    return body.data
  },
  listAddresses: (id: string) => apiGet<Address[]>(`/api/v1/persons/${id}/addresses`),
  addAddress: (id: string, input: AddressInput) =>
    apiPost<Address>(`/api/v1/persons/${id}/addresses`, input),
  updateAddress: (id: string, addressId: string, input: AddressInput) =>
    apiPatch<Address>(`/api/v1/persons/${id}/addresses/${addressId}`, input),
  deleteAddress: (id: string, addressId: string) =>
    apiDelete<{ status: string }>(`/api/v1/persons/${id}/addresses/${addressId}`),
  listDocuments: (id: string) => apiGet<PersonDocument[]>(`/api/v1/persons/${id}/documents`),
  addDocument: (id: string, input: DocumentInput) =>
    apiPost<PersonDocument>(`/api/v1/persons/${id}/documents`, input),
  updateDocument: (id: string, documentId: string, input: DocumentInput) =>
    apiPatch<PersonDocument>(`/api/v1/persons/${id}/documents/${documentId}`, input),
  deleteDocument: (id: string, documentId: string) =>
    apiDelete<{ status: string }>(`/api/v1/persons/${id}/documents/${documentId}`),
}

export const regionsApi = {
  provinces: () => apiGet<Region[]>('/api/v1/regions/provinces'),
  cities: (provinceId: string) =>
    apiGet<Region[]>(`/api/v1/regions/cities?province_id=${provinceId}`),
  districts: (cityId: string) =>
    apiGet<Region[]>(`/api/v1/regions/districts?city_id=${cityId}`),
  villages: (districtId: string) =>
    apiGet<Region[]>(`/api/v1/regions/villages?district_id=${districtId}`),
}
