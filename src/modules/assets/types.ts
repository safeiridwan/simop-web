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

export interface AssetAssignment {
  id: string
  asset_id: string
  person_id: string | null
  person_name: string | null
  organization_unit_id: string | null
  assigned_at: string
  returned_at: string | null
  notes: string | null
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
  assignments: AssetAssignment[]
  maintenance: AssetMaintenance[]
  disposals: AssetDisposal[]
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
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
