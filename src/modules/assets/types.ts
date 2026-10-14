export interface AssetCategory {
  id: string
  code: string
  name: string
  description: string | null
  is_active: boolean
}

export interface AssetLocation {
  id: string
  organization_unit_id: string | null
  name: string
  address: string | null
}

export interface Asset {
  id: string
  asset_code: string
  name: string
  category_id: string | null
  category_name: string | null
  organization_unit_id: string | null
  location_id: string | null
  location_name: string | null
  acquisition_date: string | null
  acquisition_value: number | null
  condition: string
  status: string
  notes: string | null
  created_at: string
}

export interface AssetTransactionHistory {
  id: string
  transaction_code: string
  borrower_nik: string
  borrower_name: string
  quantity: number
  borrow_date: string | null
  return_estimate_date: string | null
  actual_return_date: string | null
  status: string
}

export interface AssetMaintenance {
  id: string
  asset_id: string
  maintenance_date: string | null
  description: string
  cost: number | null
  performed_by: string | null
  status: string
}

export interface AssetDisposal {
  id: string
  asset_id: string
  disposal_date: string | null
  reason: string | null
  method: string | null
  proceeds: number | null
}

export interface AssetDetail {
  asset: Asset
  transactions: AssetTransactionHistory[]
  maintenance: AssetMaintenance[]
  disposals: AssetDisposal[]
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export interface TransactionItem {
  id: string
  category_id: string
  category_code: string
  category_name: string
  quantity: number
  conditions: Record<string, number>
}

export interface AssetTransaction {
  id: string
  transaction_code: string
  borrower_name: string
  borrower_nik: string
  borrower_phone: string
  borrower_address: string | null
  borrow_date: string | null
  return_estimate_date: string | null
  status: string
  actual_return_date: string | null
  borrow_photo_file_id: string | null
  return_photo_file_id: string | null
  cancel_reason?: string | null
  first_category_code?: string
  first_category_name?: string
  item_count: number
  created_at: string
}

export interface AssetTransactionDetail {
  transaction: AssetTransaction
  items: TransactionItem[]
  returns: TransactionItem[]
}

export interface TransactionItemInput {
  category_id: string
  quantity: number
  conditions: Record<string, number>
}

export const TRANSACTION_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PROPOSED', label: 'Diajukan' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

export interface ImportResult {
  created: number
  skipped: number
  errors: { row: number; message: string }[]
}

export const TRANSACTION_TRANSITIONS: Record<string, { action: string; label: string }[]> = {
  DRAFT: [{ action: 'submit', label: 'Ajukan' }],
  PROPOSED: [{ action: 'approve', label: 'Setujui' }],
  APPROVED: [{ action: 'complete', label: 'Selesaikan' }],
}

export function transactionStatusLabel(status: string): string {
  return TRANSACTION_STATUSES.find((s) => s.value === status)?.label ?? status
}

/** The borrow/return header section is editable only in Draft. */
export function canEditTransaction(status: string): boolean {
  return status === 'DRAFT'
}

/** The return section is fillable once approved, until completion. */
export function canEditReturn(status: string): boolean {
  return status === 'APPROVED'
}

/** The return section is shown from approval onward. */
export function returnVisible(status: string): boolean {
  return status === 'APPROVED' || status === 'COMPLETED'
}

/** First category label plus "+N lainnya" for multi-line transactions. */
export function transactionAssetsLabel(tx: AssetTransaction): string {
  if (!tx.first_category_code) return '—'
  const base = `${tx.first_category_code} - ${tx.first_category_name}`
  const others = (tx.item_count ?? 1) - 1
  return others > 0 ? `${base} +${others} lainnya` : base
}

/** Human-readable condition summary, e.g. "5 Baik, 1 Rusak ringan". */
export function conditionSummary(conditions: Record<string, number>): string {
  const parts = ASSET_CONDITIONS.filter((c) => (conditions[c.value] ?? 0) > 0).map(
    (c) => `${conditions[c.value]} ${c.label}`,
  )
  return parts.length > 0 ? parts.join(', ') : '—'
}

export function conditionsTotal(conditions: Record<string, number>): number {
  return Object.values(conditions).reduce((sum, v) => sum + (Number(v) || 0), 0)
}

export const ASSET_CONDITIONS = [
  { value: 'GOOD', label: 'Baik' },
  { value: 'FAIR', label: 'Cukup' },
  { value: 'DAMAGED', label: 'Rusak ringan' },
  { value: 'BROKEN', label: 'Rusak berat' },
]

export const ASSET_STATUSES = [
  { value: 'AVAILABLE', label: 'Tersedia' },
  { value: 'ASSIGNED', label: 'Dipinjam' },
  { value: 'MAINTENANCE', label: 'Pemeliharaan' },
  { value: 'DISPOSED', label: 'Dihapus' },
  { value: 'LOST', label: 'Hilang' },
]

export const MAINTENANCE_STATUSES = [
  { value: 'PLANNED', label: 'Direncanakan' },
  { value: 'IN_PROGRESS', label: 'Berjalan' },
  { value: 'DONE', label: 'Selesai' },
]

export function assetStatusLabel(status: string): string {
  return ASSET_STATUSES.find((s) => s.value === status)?.label ?? status
}

export function assetConditionLabel(condition: string): string {
  return ASSET_CONDITIONS.find((c) => c.value === condition)?.label ?? condition
}
