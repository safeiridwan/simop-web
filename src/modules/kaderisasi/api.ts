import { apiDelete, apiGet, apiGetPage, apiPost, apiPut, apiUpload, downloadFile } from '@/services/http'
import type {
  CoachingGroup,
  GroupAttendanceSummary,
  GroupDetail,
  GroupMutabaahSummary,
  GroupMember,
  GroupSession,
  Level,
  MembershipProfile,
  PageMeta,
  SummaryPayload,
  SummarySection,
  Taklimat,
} from './types'

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
  murabbi_cadre_profile_id: string
  level_id: string
  status: string
  formed_at: string
  member_ids: string[]
}

export interface ListGroupsQuery {
  name?: string
  levelId?: string
  murabbi?: string
  status?: string
  formedFrom?: string
  formedTo?: string
  sort?: string | null
  direction?: string | null
  page?: number
  pageSize?: number
}

export interface CadreOption {
  id: string
  person_code: string
  full_name: string
  level_code: string
  level_name: string
  status: string
}

export interface CadreOptionsQuery {
  search?: string
  groupId?: string
  exclude?: string[]
  limit?: number
}

export interface ImportRowError {
  row: number
  message: string
}

export interface ImportResult {
  created: number
  skipped: number
  errors: ImportRowError[]
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

  listGroups: (query: ListGroupsQuery = {}) => {
    const p = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 10) })
    if (query.name) p.set('name', query.name)
    if (query.levelId) p.set('level_id', query.levelId)
    if (query.murabbi) p.set('murabbi', query.murabbi)
    if (query.status) p.set('status', query.status)
    if (query.formedFrom) p.set('formed_from', query.formedFrom)
    if (query.formedTo) p.set('formed_to', query.formedTo)
    if (query.sort) p.set('sort', query.sort)
    if (query.direction) p.set('direction', query.direction)
    return apiGetPage<CoachingGroup[], PageMeta>(`/api/v1/kaderisasi/coaching-groups?${p.toString()}`)
  },
  getGroup: (id: string) => apiGet<GroupDetail>(`/api/v1/kaderisasi/coaching-groups/${id}`),
  createGroup: (input: GroupInput) => apiPost<CoachingGroup>('/api/v1/kaderisasi/coaching-groups', input),
  updateGroup: (id: string, input: GroupInput) => apiPut<CoachingGroup>(`/api/v1/kaderisasi/coaching-groups/${id}`, input),
  deleteGroup: (id: string) => apiDelete<{ status: string }>(`/api/v1/kaderisasi/coaching-groups/${id}`),
  addMember: (id: string, cadreProfileId: string) =>
    apiPost<GroupMember>(`/api/v1/kaderisasi/coaching-groups/${id}/members`, { cadre_profile_id: cadreProfileId }),
  removeMember: (id: string, memberId: string) =>
    apiDelete<{ status: string }>(`/api/v1/kaderisasi/coaching-groups/${id}/members/${memberId}`),
  getMembershipProfile: (id: string, memberId: string) =>
    apiGet<MembershipProfile>(`/api/v1/kaderisasi/coaching-groups/${id}/members/${memberId}/profile`),

  groupAttendanceSummary: (id: string, from: string, to: string) => {
    const p = new URLSearchParams({ from, to })
    return apiGet<GroupAttendanceSummary>(
      `/api/v1/kaderisasi/coaching-groups/${id}/attendance-summary?${p.toString()}`,
    )
  },
  groupMutabaahSummary: (id: string, from: string, to: string) => {
    const p = new URLSearchParams({ from, to })
    return apiGet<GroupMutabaahSummary>(
      `/api/v1/kaderisasi/coaching-groups/${id}/mutabaah-summary?${p.toString()}`,
    )
  },

  listSessions: (id: string, query: { page?: number; pageSize?: number } = {}) =>
    apiGetPage<GroupSession[], PageMeta>(
      `/api/v1/kaderisasi/coaching-groups/${id}/sessions?page=${query.page ?? 1}&page_size=${query.pageSize ?? 10}`,
    ),

  cadreOptions: (query: CadreOptionsQuery = {}) => {
    const p = new URLSearchParams()
    if (query.search) p.set('search', query.search)
    if (query.groupId) p.set('group_id', query.groupId)
    if (query.limit) p.set('limit', String(query.limit))
    for (const id of query.exclude ?? []) p.append('exclude', id)
    const qs = p.toString()
    return apiGet<CadreOption[]>(`/api/v1/kaderisasi/cadre-options${qs ? `?${qs}` : ''}`)
  },

  summary: (query: { section?: SummarySection; month?: string; page?: number; pageSize?: number } = {}) => {
    const p = new URLSearchParams()
    if (query.section) p.set('section', query.section)
    if (query.month) p.set('month', query.month)
    p.set('page', String(query.page ?? 1))
    p.set('page_size', String(query.pageSize ?? 10))
    return apiGet<SummaryPayload>(`/api/v1/kaderisasi/summary?${p.toString()}`)
  },

  importTemplate: (format: 'xlsx' | 'csv') =>
    downloadFile(`/api/v1/kaderisasi/coaching-groups/import/template?format=${format}`, `template-grup-pembinaan.${format}`),
  importGroups: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiUpload<ImportResult>('/api/v1/kaderisasi/coaching-groups/import', form)
  },
}
