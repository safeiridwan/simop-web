export interface DataQualityIssue {
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

export interface SummaryRow {
  rule_code: string
  severity: string
  status: string
  count: number
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

export const RULE_LABELS: Record<string, string> = {
  DUPLICATE_PHONE: 'Nomor telepon ganda',
  MISSING_ADDRESS: 'Alamat kosong',
  INCOMPLETE_MEMBER: 'Anggota belum lengkap',
  INCOMPLETE_ORGANIZATION: 'Organisasi belum lengkap',
  MISSING_PROGRAM_BUDGET: 'Program tanpa anggaran',
  UNPOSTED_JOURNAL: 'Jurnal belum diposting',
  MISSING_RECEIPT: 'Bukti transaksi kosong',
  OVERDUE_TASK: 'Tugas melewati tenggat',
}

export const SEVERITIES = [
  { value: 'LOW', label: 'Rendah' },
  { value: 'MEDIUM', label: 'Sedang' },
  { value: 'HIGH', label: 'Tinggi' },
]

export const ISSUE_STATUSES = [
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'IGNORED', label: 'Diabaikan' },
]

export function ruleLabel(code: string): string {
  return RULE_LABELS[code] ?? code
}

export function severityLabel(severity: string): string {
  return SEVERITIES.find((s) => s.value === severity)?.label ?? severity
}
