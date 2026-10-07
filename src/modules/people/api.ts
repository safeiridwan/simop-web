import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from '@/services/http'
import type {
  Address,
  AddressInput,
  PageMeta,
  Person,
  PersonDocument,
  PersonInput,
  Region,
} from './types'

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
  listAddresses: (id: string) => apiGet<Address[]>(`/api/v1/persons/${id}/addresses`),
  addAddress: (id: string, input: AddressInput) =>
    apiPost<Address>(`/api/v1/persons/${id}/addresses`, input),
  deleteAddress: (id: string, addressId: string) =>
    apiDelete<{ status: string }>(`/api/v1/persons/${id}/addresses/${addressId}`),
  listDocuments: (id: string) => apiGet<PersonDocument[]>(`/api/v1/persons/${id}/documents`),
  addDocument: (id: string, input: { document_type: string; document_number?: string }) =>
    apiPost<PersonDocument>(`/api/v1/persons/${id}/documents`, input),
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
