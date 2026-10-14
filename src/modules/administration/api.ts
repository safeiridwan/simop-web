import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost, apiUpload, downloadFile } from '@/services/http'
import type { Letter, LetterDetail, Notula, NumberTemplate, PageMeta, Reference, ReferenceKind, Token } from './types'

export interface LetterQuery {
  category?: string
  status?: string
  jenisId?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface LetterInput {
  category: string
  jenis_id?: string
  origin_number?: string
  letter_date?: string
  received_date?: string
  sender?: string
  recipient?: string
  perihal: string
  summary?: string
  sifat?: string
  content_html?: string
  content_file_id?: string
  file_id?: string
  organization_unit_id?: string
  lampiran?: number
}

export interface AgendaQuery {
  category?: string
  status?: string
  jenisId?: string
  from?: string
  to?: string
  keyword?: string
  sender?: string
  dispositionStatus?: string
}

function letterParams(query: LetterQuery): string {
  const params = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 10) })
  if (query.category) params.set('category', query.category)
  if (query.status) params.set('status', query.status)
  if (query.jenisId) params.set('jenis_id', query.jenisId)
  if (query.search) params.set('search', query.search)
  return params.toString()
}

function agendaParams(query: AgendaQuery): string {
  const params = new URLSearchParams()
  if (query.category) params.set('category', query.category)
  if (query.status) params.set('status', query.status)
  if (query.jenisId) params.set('jenis_id', query.jenisId)
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  if (query.keyword) params.set('keyword', query.keyword)
  if (query.sender) params.set('sender', query.sender)
  if (query.dispositionStatus) params.set('disposition_status', query.dispositionStatus)
  return params.toString()
}

export const correspondenceApi = {
  references: (kind?: ReferenceKind) =>
    apiGet<Reference[]>(`/api/v1/correspondence/references${kind ? `?kind=${kind}` : ''}`),
  createReference: (input: { kind: string; code: string; name?: string; retention_years?: number }) =>
    apiPost<Reference>('/api/v1/correspondence/references', input),
  updateReference: (
    id: string,
    input: { code: string; name?: string; retention_years?: number; is_active?: boolean },
  ) => apiPatch<Reference>(`/api/v1/correspondence/references/${id}`, input),
  deleteReference: (id: string) => apiDelete<{ status: string }>(`/api/v1/correspondence/references/${id}`),

  templates: () => apiGet<NumberTemplate[]>('/api/v1/correspondence/number-templates'),
  createTemplate: (input: { name: string; tokens: Token[]; activate?: boolean }) =>
    apiPost<NumberTemplate>('/api/v1/correspondence/number-templates', input),
  updateTemplate: (id: string, input: { name: string; tokens: Token[] }) =>
    apiPatch<NumberTemplate>(`/api/v1/correspondence/number-templates/${id}`, input),
  activateTemplate: (id: string) => apiPost<{ status: string }>(`/api/v1/correspondence/number-templates/${id}/activate`),
  deleteTemplate: (id: string) => apiDelete<{ status: string }>(`/api/v1/correspondence/number-templates/${id}`),

  upload: (purpose: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('purpose', purpose)
    return apiUpload<{ file_id: string }>('/api/v1/correspondence/upload', form)
  },

  letters: (query: LetterQuery = {}) =>
    apiGetPage<Letter[], PageMeta>(`/api/v1/correspondence/letters?${letterParams(query)}`),
  getLetter: (id: string) => apiGet<LetterDetail>(`/api/v1/correspondence/letters/${id}`),
  createLetter: (input: LetterInput) => apiPost<Letter>('/api/v1/correspondence/letters', input),
  updateLetter: (id: string, input: LetterInput) => apiPatch<Letter>(`/api/v1/correspondence/letters/${id}`, input),
  submitLetter: (id: string) => apiPost<Letter>(`/api/v1/correspondence/letters/${id}/submit`),
  approveLetter: (id: string, note = '') =>
    apiPost<Letter>(`/api/v1/correspondence/letters/${id}/approve`, { note }),
  signLetter: (id: string, note = '') => apiPost<Letter>(`/api/v1/correspondence/letters/${id}/sign`, { note }),
  rejectLetter: (id: string, stage: string, note: string) =>
    apiPost<Letter>(`/api/v1/correspondence/letters/${id}/reject`, { stage, note }),
  distribute: (
    id: string,
    input: { status: string; tracking_number?: string; email_link?: string; wa_link?: string },
  ) => apiPost<Letter>(`/api/v1/correspondence/letters/${id}/distribute`, input),
  addDisposition: (id: string, input: { to_user_id: string; instruction: string; note?: string }) =>
    apiPost(`/api/v1/correspondence/letters/${id}/dispositions`, input),
  setDispositionStatus: (id: string, status: string) =>
    apiPost(`/api/v1/correspondence/dispositions/${id}/status`, { status }),

  agenda: (query: AgendaQuery = {}, page = 1, pageSize = 10) =>
    apiGetPage<Letter[], PageMeta>(
      `/api/v1/correspondence/agenda?${agendaParams(query)}&page=${page}&page_size=${pageSize}`,
    ),
  exportAgenda: (query: AgendaQuery, format: 'xlsx' | 'pdf') =>
    downloadFile(`/api/v1/correspondence/agenda/export?${agendaParams(query)}&format=${format}`, `buku-agenda.${format}`),

  notulae: (page = 1, pageSize = 10) =>
    apiGetPage<Notula[], PageMeta>(`/api/v1/correspondence/notulae?page=${page}&page_size=${pageSize}`),
  getNotula: (id: string) => apiGet<Notula>(`/api/v1/correspondence/notulae/${id}`),
  createNotula: (input: { organization_unit_id: string; meeting_at: string; file_id: string }) =>
    apiPost<Notula>('/api/v1/correspondence/notulae', input),
  updateNotula: (id: string, input: { organization_unit_id: string; meeting_at: string; file_id: string }) =>
    apiPatch<Notula>(`/api/v1/correspondence/notulae/${id}`, input),
  deleteNotula: (id: string) => apiDelete<{ status: string }>(`/api/v1/correspondence/notulae/${id}`),
}
