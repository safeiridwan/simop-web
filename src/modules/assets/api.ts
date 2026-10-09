import { apiGet, apiGetPage, apiPatch, apiPost } from '@/services/http'
import type { Asset, AssetCategory, AssetDetail, AssetDisposal, AssetLocation, AssetMaintenance, PageMeta } from './types'

export const assetsApi = {
  categories: () => apiGet<AssetCategory[]>('/api/v1/asset-categories'),
  createCategory: (input: { code: string; name: string }) => apiPost<AssetCategory>('/api/v1/asset-categories', input),
  locations: () => apiGet<AssetLocation[]>('/api/v1/asset-locations'),
  createLocation: (input: { name: string; address?: string }) => apiPost<AssetLocation>('/api/v1/asset-locations', input),

  list: (query: { search?: string; status?: string; categoryId?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 20) })
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
    if (query.categoryId) params.set('category_id', query.categoryId)
    return apiGetPage<Asset[], PageMeta>(`/api/v1/assets?${params.toString()}`)
  },
  get: (id: string) => apiGet<AssetDetail>(`/api/v1/assets/${id}`),
  create: (input: {
    name: string
    category_id?: string
    organization_unit_id?: string
    acquisition_date?: string
    acquisition_value?: number
    condition?: string
  }) => apiPost<Asset>('/api/v1/assets', input),
  update: (id: string, input: Record<string, unknown>) => apiPatch<Asset>(`/api/v1/assets/${id}`, input),
  assign: (id: string, personId: string, notes?: string) =>
    apiPost(`/api/v1/assets/${id}/assign`, { person_id: personId, notes }),
  returnAsset: (id: string) => apiPost(`/api/v1/assets/${id}/return`, {}),
  maintenance: (id: string, input: { maintenance_date?: string; description: string; cost?: number; status?: string }) =>
    apiPost<AssetMaintenance>(`/api/v1/assets/${id}/maintenance`, input),
  dispose: (id: string, input: { disposal_date?: string; reason?: string; method?: string }) =>
    apiPost<AssetDisposal>(`/api/v1/assets/${id}/dispose`, input),
}
