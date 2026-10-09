export interface Account {
  id: string
  code: string
  name: string
  account_type: string
  parent_id: string | null
  is_active: boolean
}

export interface Fund {
  id: string
  code: string
  name: string
  description: string | null
  is_active: boolean
}

export interface Budget {
  id: string
  organization_unit_id: string
  program_id: string | null
  fund_id: string | null
  account_id: string
  fiscal_year: number
  budget_amount: number
  status: string
  approved_at: string | null
  created_at: string
}

export interface JournalLine {
  id: string
  account_id: string
  account_code: string
  account_name: string
  debit: number
  credit: number
  description: string | null
}

export interface Journal {
  id: string
  journal_number: string
  transaction_date: string | null
  description: string | null
  organization_unit_id: string
  program_id: string | null
  fund_id: string | null
  status: string
  posted_at: string | null
  total_debit: number
  total_credit: number
  created_at: string
}

export interface JournalDetail {
  journal: Journal
  lines: JournalLine[]
  total_debit: number
  total_credit: number
}

export interface Reimbursement {
  id: string
  organization_unit_id: string
  program_id: string | null
  requester_id: string
  amount: number
  reason: string | null
  status: string
  approved_at: string | null
  paid_at: string | null
  created_at: string
}

export interface Receipt {
  id: string
  journal_entry_id: string | null
  reimbursement_id: string | null
  file_id: string | null
  receipt_number: string
  receipt_date: string | null
  verified_at: string | null
  created_at: string
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export const ACCOUNT_TYPES = [
  { value: 'ASSET', label: 'Aset' },
  { value: 'LIABILITY', label: 'Kewajiban' },
  { value: 'EQUITY', label: 'Ekuitas' },
  { value: 'INCOME', label: 'Pendapatan' },
  { value: 'EXPENSE', label: 'Beban' },
]

export const FINANCE_REPORT_KEYS = [
  { key: 'finance', label: 'Buku Jurnal' },
  { key: 'profit-loss', label: 'Laba Rugi' },
  { key: 'balance-sheet', label: 'Neraca' },
  { key: 'cash-flow', label: 'Arus Kas' },
]

/** Finance reports that accept a from/to date range. */
export const DATED_REPORT_KEYS = new Set(['profit-loss', 'balance-sheet', 'cash-flow'])

export const JOURNAL_STATUSES = [
  { value: 'DRAFT', label: 'Draf' },
  { value: 'SUBMITTED', label: 'Diajukan' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'POSTED', label: 'Diposting' },
  { value: 'VOID', label: 'Dibatalkan' },
]

export const BUDGET_TRANSITIONS: Record<string, { action: string; label: string }[]> = {
  DRAFT: [{ action: 'submit', label: 'Ajukan' }],
  SUBMITTED: [{ action: 'approve', label: 'Setujui' }],
  APPROVED: [{ action: 'close', label: 'Tutup' }],
}

export const JOURNAL_TRANSITIONS: Record<string, { action: string; label: string; permission: string }[]> = {
  DRAFT: [
    { action: 'submit', label: 'Ajukan', permission: 'finance:update' },
    { action: 'approve', label: 'Setujui', permission: 'finance:approve' },
  ],
  SUBMITTED: [{ action: 'approve', label: 'Setujui', permission: 'finance:approve' }],
  APPROVED: [{ action: 'post', label: 'Posting', permission: 'finance:post' }],
}

export const REIMBURSEMENT_TRANSITIONS: Record<string, { action: string; label: string; permission: string }[]> = {
  DRAFT: [{ action: 'submit', label: 'Ajukan', permission: 'finance:update' }],
  SUBMITTED: [
    { action: 'approve', label: 'Setujui', permission: 'finance:approve' },
    { action: 'reject', label: 'Tolak', permission: 'finance:approve' },
  ],
  APPROVED: [{ action: 'pay', label: 'Bayar', permission: 'finance:update' }],
}

export function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.label ?? type
}
