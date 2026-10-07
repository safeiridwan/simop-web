import { apiGetPage, apiPost } from '@/services/http'
import type { Affiliation, AffiliationInput, PageMeta } from './types'

export interface ListAffiliationsQuery {
  page?: number
  pageSize?: number
  type?: string
  status?: string
  search?: string
}

export const affiliationsApi = {
  list: (query: ListAffiliationsQuery = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.pageSize ?? 20))
    if (query.type) params.set('affiliation_type', query.type)
    if (query.status) params.set('status', query.status)
    if (query.search) params.set('search', query.search)
    return apiGetPage<Affiliation[], PageMeta>(`/api/v1/affiliations?${params.toString()}`)
  },
  create: (input: AffiliationInput) => apiPost<Affiliation>('/api/v1/affiliations', input),
}
