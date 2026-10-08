export interface Document {
  id: string
  organization_unit_id: string
  document_type: string
  document_number: string | null
  title: string
  document_date: string | null
  file_id: string | null
  version: number
  status: string
  created_at: string
  updated_at: string
}

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_id: string | null
  uploaded_at: string
  checksum: string | null
}

export interface DocumentAccess {
  id: string
  document_id: string
  role_id: string
  role_code: string
  permission: string
}

export interface FileMeta {
  id: string
  original_name: string
  mime_type: string
  size_bytes: number
  checksum: string | null
  created_at: string
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export const DOCUMENT_STATUSES = [
  { value: 'DRAFT', label: 'Draf' },
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'ARCHIVED', label: 'Arsip' },
]

export const ACCESS_PERMISSIONS = [
  { value: 'READ', label: 'Baca' },
  { value: 'WRITE', label: 'Tulis' },
  { value: 'MANAGE', label: 'Kelola' },
]

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
