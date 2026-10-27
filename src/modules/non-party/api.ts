import { apiGetPage, apiPost, apiUpload, downloadFile } from '@/services/http'
import type { Affiliation, AffiliationInput, ImportResult, PageMeta } from './types'

export interface ListAffiliationsQuery {
  page?: number
  pageSize?: number
  type?: string
  status?: string
  fullName?: string
  personCode?: string
  city?: string
  district?: string
  village?: string
  startFrom?: string
  startTo?: string
  sort?: string | null
  direction?: string | null
}

export const affiliationsApi = {
  list: (query: ListAffiliationsQuery = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.pageSize ?? 10))
    if (query.type) params.set('affiliation_type', query.type)
    if (query.status) params.set('status', query.status)
    if (query.fullName) params.set('full_name', query.fullName)
    if (query.personCode) params.set('person_code', query.personCode)
    if (query.city) params.set('city', query.city)
    if (query.district) params.set('district', query.district)
    if (query.village) params.set('village', query.village)
    if (query.startFrom) params.set('start_from', query.startFrom)
    if (query.startTo) params.set('start_to', query.startTo)
    if (query.sort) params.set('sort', query.sort)
    if (query.direction) params.set('direction', query.direction)
    return apiGetPage<Affiliation[], PageMeta>(`/api/v1/affiliations?${params.toString()}`)
  },
  create: (input: AffiliationInput) => apiPost<Affiliation>('/api/v1/affiliations', input),
  importTemplate: (format: 'csv' | 'xlsx') =>
    downloadFile(`/api/v1/affiliations/import/template?format=${format}`, `template-non-kader.${format}`),
  import: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiUpload<ImportResult>('/api/v1/affiliations/import', form)
  },
}
