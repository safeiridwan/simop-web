import { apiGet, apiGetPage, apiPatch, apiPost, apiUpload, downloadFile } from '@/services/http'
import type { CreateMemberInput, ImportResult, Member, MemberHistory, PageMeta } from './types'

export interface ListMembersQuery {
  page?: number
  pageSize?: number
  status?: string
  fullName?: string
  memberNumber?: string
  city?: string
  district?: string
  village?: string
  joinFrom?: string
  joinTo?: string
  sort?: string | null
  direction?: string | null
}

export const membersApi = {
  list: (query: ListMembersQuery = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.pageSize ?? 10))
    if (query.status) params.set('status', query.status)
    if (query.fullName) params.set('full_name', query.fullName)
    if (query.memberNumber) params.set('member_number', query.memberNumber)
    if (query.city) params.set('city', query.city)
    if (query.district) params.set('district', query.district)
    if (query.village) params.set('village', query.village)
    if (query.joinFrom) params.set('join_from', query.joinFrom)
    if (query.joinTo) params.set('join_to', query.joinTo)
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
  exportUrl: (query: ListMembersQuery = {}) => {
    const params = new URLSearchParams()
    if (query.status) params.set('status', query.status)
    if (query.fullName) params.set('full_name', query.fullName)
    if (query.memberNumber) params.set('member_number', query.memberNumber)
    if (query.city) params.set('city', query.city)
    if (query.district) params.set('district', query.district)
    if (query.village) params.set('village', query.village)
    if (query.joinFrom) params.set('join_from', query.joinFrom)
    if (query.joinTo) params.set('join_to', query.joinTo)
    if (query.sort) params.set('sort', query.sort)
    if (query.direction) params.set('direction', query.direction)
    const qs = params.toString()
    return `/api/v1/members/export${qs ? `?${qs}` : ''}`
  },
  importTemplate: (format: 'csv' | 'xlsx') =>
    downloadFile(`/api/v1/members/import/template?format=${format}`, `template-anggota.${format}`),
  import: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiUpload<ImportResult>('/api/v1/members/import', form)
  },
}
