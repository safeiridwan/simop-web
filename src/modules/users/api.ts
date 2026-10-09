import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from '@/services/http'
import type { CreateUserInput, PageMeta, User } from './types'

export interface ListUsersQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}

export interface ScopeGrant {
  organization_unit_id: string
  include_descendants: boolean
}

export const usersApi = {
  list: (query: ListUsersQuery = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.pageSize ?? 20))
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
    return apiGetPage<User[], PageMeta>(`/api/v1/users?${params.toString()}`)
  },
  get: (id: string) => apiGet<User>(`/api/v1/users/${id}`),
  create: (input: CreateUserInput) => apiPost<User>('/api/v1/users', input),
  update: (id: string, patch: Partial<CreateUserInput> & { status?: string }) =>
    apiPatch<User>(`/api/v1/users/${id}`, patch),
  setRoles: (id: string, roleCodes: string[]) =>
    apiPost<User>(`/api/v1/users/${id}/roles`, { role_codes: roleCodes }),
  removeRole: (id: string, roleCode: string) =>
    apiDelete<User>(`/api/v1/users/${id}/roles/${roleCode}`),
  scopes: (id: string) => apiGet<ScopeGrant[]>(`/api/v1/users/${id}/scopes`),
  addScope: (id: string, organizationUnitId: string, includeDescendants: boolean) =>
    apiPost<ScopeGrant>(`/api/v1/users/${id}/scopes`, {
      organization_unit_id: organizationUnitId,
      include_descendants: includeDescendants,
    }),
  removeScope: (id: string, organizationUnitId: string) =>
    apiDelete<{ status: string }>(`/api/v1/users/${id}/scopes/${organizationUnitId}`),
}
