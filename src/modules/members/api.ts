import { apiGet, apiGetPage, apiPatch, apiPost, apiUpload, downloadFile } from '@/services/http'
import type { CreateMemberInput, ImportResult, Member, MemberHistory, PageMeta } from './types'

export interface ListMembersQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  sort?: string | null
  direction?: string | null
}

export const membersApi = {
  list: (query: ListMembersQuery = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.pageSize ?? 10))
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
    if (query.sort) params.set('sort', query.sort)
    if (query.direction) params.set('direction', query.direction)
    return apiGetPage<Member[], PageMeta>(`/api/v1/members?${params.toString()}`)
  },
  get: (id: string) => apiGet<Member>(`/api/v1/members/${id}`),
  create: (input: CreateMemberInput) => apiPost<Member>('/api/v1/members', input),
  update: (id: string, input: { join_date?: string; membership_source?: string }) =>
    apiPatch<Member>(`/api/v1/members/${id}`, input),
  changeStatus: (id: string, status: string, reason?: string) =>
    apiPost<Member>(`/api/v1/members/${id}/status`, { status, reason }),
  verify: (id: string) => apiPost<Member>(`/api/v1/members/${id}/verify`),
  history: (id: string) => apiGet<MemberHistory[]>(`/api/v1/members/${id}/history`),
  exportUrl: '/api/v1/members/export',
  importTemplate: (format: 'csv' | 'xlsx') =>
    downloadFile(`/api/v1/members/import/template?format=${format}`, `template-anggota.${format}`),
  import: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiUpload<ImportResult>('/api/v1/members/import', form)
  },
}
