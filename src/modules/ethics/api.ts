import { apiGet, apiGetPage, apiPatch, apiPost } from '@/services/http'
import type {
  EthicsCase,
  EthicsCaseDetail,
  EthicsDecision,
  EthicsEvidence,
  EthicsHearing,
  EthicsInvestigation,
  EthicsReport,
  PageMeta,
} from './types'

export const ethicsApi = {
  list: (query: { search?: string; status?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 20) })
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
    return apiGetPage<EthicsCase[], PageMeta>(`/api/v1/ethics/cases?${params.toString()}`)
  },
  get: (id: string) => apiGet<EthicsCaseDetail>(`/api/v1/ethics/cases/${id}`),
  create: (input: { title: string; description?: string; confidentiality?: string }) =>
    apiPost<EthicsCase>('/api/v1/ethics/cases', input),
  update: (id: string, input: { status?: string; title?: string; description?: string }) =>
    apiPatch<EthicsCase>(`/api/v1/ethics/cases/${id}`, input),
  addReport: (id: string, input: { content: string; is_anonymous?: boolean }) =>
    apiPost<EthicsReport>(`/api/v1/ethics/cases/${id}/reports`, input),
  addInvestigation: (id: string, input: { findings?: string; status?: string }) =>
    apiPost<EthicsInvestigation>(`/api/v1/ethics/cases/${id}/investigations`, input),
  addEvidence: (id: string, input: { description: string; file_id?: string }) =>
    apiPost<EthicsEvidence>(`/api/v1/ethics/cases/${id}/evidence`, input),
  addHearing: (id: string, input: { scheduled_at?: string; location?: string; status?: string }) =>
    apiPost<EthicsHearing>(`/api/v1/ethics/cases/${id}/hearings`, input),
  addDecision: (id: string, input: { decision_number?: string; decision_text: string; sanctions?: { sanction_type: string; effective_at?: string }[] }) =>
    apiPost<EthicsDecision>(`/api/v1/ethics/cases/${id}/decisions`, input),
}
