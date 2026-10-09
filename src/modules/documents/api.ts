import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from '@/services/http'
import { getAccessToken } from '@/services/http'
import type { Document, DocumentAccess, DocumentVersion, FileMeta, PageMeta } from './types'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export interface ListDocumentsQuery {
  search?: string
  status?: string
  documentType?: string
  page?: number
  pageSize?: number
}

export const documentsApi = {
  list: (query: ListDocumentsQuery = {}) => {
    const params = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 20) })
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
    if (query.documentType) params.set('document_type', query.documentType)
    return apiGetPage<Document[], PageMeta>(`/api/v1/documents?${params.toString()}`)
  },
  get: (id: string) => apiGet<Document>(`/api/v1/documents/${id}`),
  create: (input: {
    organization_unit_id: string
    document_type: string
    document_number?: string
    title: string
    document_date?: string
    file_id?: string
  }) => apiPost<Document>('/api/v1/documents', input),
  update: (id: string, input: Partial<Document>) => apiPatch<Document>(`/api/v1/documents/${id}`, input),
  versions: (id: string) => apiGet<DocumentVersion[]>(`/api/v1/documents/${id}/versions`),
  addVersion: (id: string, fileId: string) =>
    apiPost<{ document: Document; version: DocumentVersion }>(`/api/v1/documents/${id}/versions`, { file_id: fileId }),
  access: (id: string) => apiGet<DocumentAccess[]>(`/api/v1/documents/${id}/access`),
  addAccess: (id: string, roleId: string, permission: string) =>
    apiPost<DocumentAccess>(`/api/v1/documents/${id}/access`, { role_id: roleId, permission }),
  removeAccess: (id: string, accessId: string) =>
    apiDelete<{ status: string }>(`/api/v1/documents/${id}/access/${accessId}`),

  upload: async (file: File): Promise<FileMeta> => {
    const form = new FormData()
    form.append('file', file)
    const headers: Record<string, string> = { Accept: 'application/json' }
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${baseUrl}/api/v1/files/upload`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: form,
    })
    const body = (await res.json()) as { data: FileMeta; error?: { message?: string } }
    if (!res.ok) throw new Error(body.error?.message ?? 'Upload gagal')
    return body.data
  },
  downloadUrl: (fileId: string) => `${baseUrl}/api/v1/files/${fileId}`,
}
