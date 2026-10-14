import { apiDelete, apiGet, apiGetPage, apiPost, apiPut } from '@/services/http'
import type { CoachingGroup, GroupDetail, GroupMember, Level, PageMeta, Taklimat } from './types'

export interface ListQuery {
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

function params(query: ListQuery): string {
  const p = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 10) })
  if (query.status) p.set('status', query.status)
  if (query.search) p.set('search', query.search)
  return p.toString()
}

export interface TaklimatInput {
  title: string
  publish_date: string
  content_html?: string
  target_level_ids: string[]
}

export interface GroupInput {
  name: string
  murabbi: string
  level_id: string
  status?: string
}

export const kaderisasiApi = {
  levels: () => apiGet<Level[]>('/api/v1/kaderisasi/levels'),

  listTaklimat: (query: ListQuery = {}) =>
    apiGetPage<Taklimat[], PageMeta>(`/api/v1/kaderisasi/taklimat?${params(query)}`),
  getTaklimat: (id: string) => apiGet<Taklimat>(`/api/v1/kaderisasi/taklimat/${id}`),
  createTaklimat: (input: TaklimatInput) => apiPost<Taklimat>('/api/v1/kaderisasi/taklimat', input),
  updateTaklimat: (id: string, input: TaklimatInput) => apiPut<Taklimat>(`/api/v1/kaderisasi/taklimat/${id}`, input),
  deleteTaklimat: (id: string) => apiDelete<{ status: string }>(`/api/v1/kaderisasi/taklimat/${id}`),
  publishTaklimat: (id: string) => apiPost<Taklimat>(`/api/v1/kaderisasi/taklimat/${id}/publish`),
  unpublishTaklimat: (id: string) => apiPost<Taklimat>(`/api/v1/kaderisasi/taklimat/${id}/unpublish`),

  listGroups: (query: ListQuery = {}) =>
    apiGetPage<CoachingGroup[], PageMeta>(`/api/v1/kaderisasi/coaching-groups?${params(query)}`),
  getGroup: (id: string) => apiGet<GroupDetail>(`/api/v1/kaderisasi/coaching-groups/${id}`),
  createGroup: (input: GroupInput) => apiPost<CoachingGroup>('/api/v1/kaderisasi/coaching-groups', input),
  updateGroup: (id: string, input: GroupInput) => apiPut<CoachingGroup>(`/api/v1/kaderisasi/coaching-groups/${id}`, input),
  deleteGroup: (id: string) => apiDelete<{ status: string }>(`/api/v1/kaderisasi/coaching-groups/${id}`),
  addMember: (id: string, cadreProfileId: string) =>
    apiPost<GroupMember>(`/api/v1/kaderisasi/coaching-groups/${id}/members`, { cadre_profile_id: cadreProfileId }),
  removeMember: (id: string, memberId: string) =>
    apiDelete<{ status: string }>(`/api/v1/kaderisasi/coaching-groups/${id}/members/${memberId}`),
}
