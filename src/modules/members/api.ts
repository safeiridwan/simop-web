import { apiGet, apiGetPage, apiPatch, apiPost } from '@/services/http'
import type { CreateMemberInput, Member, MemberHistory, PageMeta } from './types'

export interface ListMembersQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}

export const membersApi = {
  list: (query: ListMembersQuery = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.pageSize ?? 20))
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
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
}
