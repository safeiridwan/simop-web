import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost, apiUpload } from '@/services/http'
import type { PageMeta, Program, ProgramDetail, ProgramReport, ProgramTarget } from './types'

export interface ListProgramsQuery {
  search?: string
  status?: string
  organizationUnitId?: string
  page?: number
  pageSize?: number
}

export const programsApi = {
  list: (query: ListProgramsQuery = {}) => {
    const params = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 10) })
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
    activity_date?: string
    location?: string
    requested_amount?: number
  }) => apiPost<Program>('/api/v1/programs', input),
  update: (id: string, input: Record<string, unknown>) => apiPatch<Program>(`/api/v1/programs/${id}`, input),
  transition: (id: string, action: string) => apiPost<Program>(`/api/v1/programs/${id}/${action}`),

  addTarget: (id: string, input: { target_name: string; target_value?: number; unit?: string }) =>
    apiPost<ProgramTarget>(`/api/v1/programs/${id}/targets`, input),
  updateTargetActual: (id: string, targetId: string, actualValue?: number) =>
    apiPatch<ProgramTarget>(`/api/v1/programs/${id}/targets/${targetId}`, { actual_value: actualValue }),
  deleteTarget: (id: string, targetId: string) =>
    apiDelete<{ status: string }>(`/api/v1/programs/${id}/targets/${targetId}`),

  addReport: (
    id: string,
    input: { title: string; summary?: string; period_start?: string; period_end?: string; actual_amount?: number; file_id?: string },
  ) => apiPost<ProgramReport>(`/api/v1/programs/${id}/reports`, input),

  uploadFile: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiUpload<{ file_id: string }>(`/api/v1/programs/${id}/upload`, form)
  },
}
