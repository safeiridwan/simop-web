export interface ReadinessItem {
  code: string
  open: number
  resolved: number
  ignored: number
}

export interface ReadinessSummary {
  total_open: number
  total_resolved: number
  items: ReadinessItem[]
}

export interface ReadinessCheck {
  id: string
  rule_code: string
  severity: string
  resource_type: string
  resource_id: string
  details: string | null
  status: string
  detected_at: string
  resolved_at: string | null
}

export interface ScanResult {
  detected: number
  resolved: number
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export const CHECK_LABELS: Record<string, string> = {
  ER_MEMBERSHIP_COMPLETENESS: 'Kelengkapan Anggota',
  ER_ORGANIZATION_COMPLETENESS: 'Kelengkapan Organisasi',
  ER_OFFICER_COMPLETENESS: 'Kelengkapan Pengurus',
  ER_OFFICE_DATA_COMPLETENESS: 'Kelengkapan Data Kantor',
  ER_DOCUMENT_COMPLETENESS: 'Kelengkapan Dokumen',
  ER_DATA_DUPLICATION: 'Duplikasi Data',
  ER_DATA_VERIFICATION: 'Verifikasi Data',
}

export const ISSUE_STATUSES = [
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'IGNORED', label: 'Diabaikan' },
]

export function checkLabel(code: string): string {
  return CHECK_LABELS[code] ?? code
}
