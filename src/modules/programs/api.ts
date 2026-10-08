import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from '@/services/http'
import type {
  Activity,
  ActivityAttendance,
  ActivityParticipant,
  PageMeta,
  Program,
  ProgramDetail,
  ProgramIndicator,
  ProgramReport,
  ProgramTarget,
} from './types'

export interface ListProgramsQuery {
  search?: string
  status?: string
  organizationUnitId?: string
}

export const programsApi = {
  list: (query: ListProgramsQuery = {}) => {
    const params = new URLSearchParams({ page: '1', page_size: '50' })
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
    if (query.organizationUnitId) params.set('organization_unit_id', query.organizationUnitId)
    return apiGetPage<Program[], PageMeta>(`/api/v1/programs?${params.toString()}`)
  },
  get: (id: string) => apiGet<ProgramDetail>(`/api/v1/programs/${id}`),
  create: (input: {
    organization_unit_id: string
    name: string
    objective?: string
    description?: string
    start_date?: string
    end_date?: string
  }) => apiPost<Program>('/api/v1/programs', input),
  update: (id: string, input: Record<string, unknown>) => apiPatch<Program>(`/api/v1/programs/${id}`, input),
  transition: (id: string, action: string) => apiPost<Program>(`/api/v1/programs/${id}/${action}`),

  addTarget: (id: string, input: { target_name: string; target_value?: number; unit?: string }) =>
    apiPost<ProgramTarget>(`/api/v1/programs/${id}/targets`, input),
  deleteTarget: (id: string, targetId: string) =>
    apiDelete<{ status: string }>(`/api/v1/programs/${id}/targets/${targetId}`),

  addIndicator: (id: string, input: { indicator_name: string; target_value?: number; actual_value?: number; unit?: string }) =>
    apiPost<ProgramIndicator>(`/api/v1/programs/${id}/indicators`, input),
  deleteIndicator: (id: string, indicatorId: string) =>
    apiDelete<{ status: string }>(`/api/v1/programs/${id}/indicators/${indicatorId}`),

  addReport: (id: string, input: { title: string; summary?: string; period_start?: string; period_end?: string }) =>
    apiPost<ProgramReport>(`/api/v1/programs/${id}/reports`, input),
}

export interface ListActivitiesQuery {
  programId?: string
  search?: string
  status?: string
}

export const activitiesApi = {
  list: (query: ListActivitiesQuery = {}) => {
    const params = new URLSearchParams({ page: '1', page_size: '50' })
    if (query.programId) params.set('program_id', query.programId)
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
    return apiGetPage<Activity[], PageMeta>(`/api/v1/activities?${params.toString()}`)
  },
  create: (input: {
    program_id?: string
    organization_unit_id: string
    name: string
    activity_date?: string
    location?: string
    status?: string
  }) => apiPost<Activity>('/api/v1/activities', input),
  listParticipants: (id: string) => apiGet<ActivityParticipant[]>(`/api/v1/activities/${id}/participants`),
  addParticipant: (id: string, personId: string, participantType: string) =>
    apiPost<ActivityParticipant>(`/api/v1/activities/${id}/participants`, {
      person_id: personId,
      participant_type: participantType,
    }),
  listAttendance: (id: string) => apiGet<ActivityAttendance[]>(`/api/v1/activities/${id}/attendance`),
  recordAttendance: (id: string, personId: string, status: string) =>
    apiPost<ActivityAttendance>(`/api/v1/activities/${id}/attendance`, { person_id: personId, status }),
}
