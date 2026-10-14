import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost, apiPut, apiUpload } from '@/services/http'
import type {
  Asset,
  AssetCategory,
  AssetDetail,
  AssetDisposal,
  AssetLocation,
  AssetMaintenance,
  AssetTransaction,
  AssetTransactionDetail,
  PageMeta,
  TransactionItemInput,
} from './types'

export interface TransactionInput {
  borrower_name: string
  borrower_nik: string
  borrower_phone: string
  borrower_address?: string
  borrow_date?: string
  return_estimate_date?: string
  borrow_photo_file_id?: string
  items: TransactionItemInput[]
}

export const assetsApi = {
  categories: () => apiGet<AssetCategory[]>('/api/v1/asset-categories'),
  createCategory: (input: { code: string; name: string }) => apiPost<AssetCategory>('/api/v1/asset-categories', input),
  locations: () => apiGet<AssetLocation[]>('/api/v1/asset-locations'),
  createLocation: (input: { name: string; address?: string }) => apiPost<AssetLocation>('/api/v1/asset-locations', input),

  list: (query: { search?: string; status?: string; categoryId?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 10) })
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
    location_id?: string
    acquisition_date?: string
    acquisition_value?: number
    condition?: string
  }) => apiPost<Asset>('/api/v1/assets', input),
  update: (id: string, input: Record<string, unknown>) => apiPatch<Asset>(`/api/v1/assets/${id}`, input),
  maintenance: (id: string, input: { maintenance_date?: string; description: string; cost?: number; status?: string }) =>
    apiPost<AssetMaintenance>(`/api/v1/assets/${id}/maintenance`, input),
  dispose: (id: string, input: { disposal_date?: string; reason?: string; method?: string }) =>
    apiPost<AssetDisposal>(`/api/v1/assets/${id}/dispose`, input),

  listTransactions: (query: { status?: string; search?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 10) })
    if (query.status) params.set('status', query.status)
    if (query.search) params.set('search', query.search)
    return apiGetPage<AssetTransaction[], PageMeta>(`/api/v1/asset-transactions?${params.toString()}`)
  },
  getTransaction: (id: string) => apiGet<AssetTransactionDetail>(`/api/v1/asset-transactions/${id}`),
  createTransaction: (input: TransactionInput) => apiPost<AssetTransaction>('/api/v1/asset-transactions', input),
  updateTransaction: (id: string, input: TransactionInput) =>
    apiPut<AssetTransaction>(`/api/v1/asset-transactions/${id}`, input),
  transitionTransaction: (id: string, action: string) =>
    apiPost<AssetTransaction>(`/api/v1/asset-transactions/${id}/${action}`),
  setReturn: (
    id: string,
    input: { actual_return_date?: string; return_photo_file_id?: string; items: TransactionItemInput[] },
  ) => apiPut<AssetTransaction>(`/api/v1/asset-transactions/${id}/return`, input),
  clearReturn: (id: string) => apiDelete<AssetTransaction>(`/api/v1/asset-transactions/${id}/return`),
  uploadTransactionPhoto: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiUpload<{ file_id: string }>(`/api/v1/asset-transactions/${id}/upload`, form)
  },
  uploadNewTransactionPhoto: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiUpload<{ file_id: string }>('/api/v1/asset-transactions/upload', form)
  },
}
