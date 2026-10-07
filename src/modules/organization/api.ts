import { apiGet, apiGetPage, apiPatch, apiPost, apiDelete } from '@/services/http'
import type { CreateUnitInput, Officer, PageMeta, Period, Position, Unit, UnitNode, UnitType } from './types'

export interface ListUnitsQuery {
  parentId?: string
  unitTypeId?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

export const organizationApi = {
  unitTypes: () => apiGet<UnitType[]>('/api/v1/organization-unit-types'),

  listUnits: (query: ListUnitsQuery = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.pageSize ?? 50))
    if (query.parentId) params.set('parent_id', query.parentId)
    if (query.unitTypeId) params.set('unit_type_id', query.unitTypeId)
    if (query.status) params.set('status', query.status)
    if (query.search) params.set('search', query.search)
    return apiGetPage<Unit[], PageMeta>(`/api/v1/organization-units?${params.toString()}`)
  },
  tree: () => apiGet<UnitNode[]>('/api/v1/organization-units/tree'),
  subtree: (id: string) => apiGet<UnitNode[]>(`/api/v1/organization-units/${id}/tree`),
  getUnit: (id: string) => apiGet<Unit>(`/api/v1/organization-units/${id}`),
  createUnit: (input: CreateUnitInput) => apiPost<Unit>('/api/v1/organization-units', input),
  updateUnit: (id: string, input: Partial<CreateUnitInput> & { unit_type_id?: string }) =>
    apiPatch<Unit>(`/api/v1/organization-units/${id}`, input),

  listPositions: (unitId: string) =>
    apiGet<Position[]>(`/api/v1/organization-positions?organization_unit_id=${unitId}`),
  createPosition: (unitId: string, input: { position_name: string; position_code: string; max_members?: number }) =>
    apiPost<Position>('/api/v1/organization-positions', { organization_unit_id: unitId, ...input }),

  listPeriods: (unitId: string) =>
    apiGet<Period[]>(`/api/v1/organization-periods?organization_unit_id=${unitId}`),
  createPeriod: (unitId: string, input: { name: string; start_date?: string; end_date?: string; status?: string }) =>
    apiPost<Period>('/api/v1/organization-periods', { organization_unit_id: unitId, ...input }),

  listOfficers: (unitId: string) =>
    apiGet<Officer[]>(`/api/v1/organization-members?organization_unit_id=${unitId}`),
  createOfficer: (input: {
    organization_unit_id: string
    person_id: string
    position_id: string
    organization_period_id?: string
    start_date?: string
  }) => apiPost<Officer>('/api/v1/organization-members', input),
  endOfficer: (id: string) => apiDelete<{ status: string }>(`/api/v1/organization-members/${id}`),
}
