export interface Program {
  id: string
  organization_unit_id: string
  organization_unit_name: string
  program_code: string
  name: string
  description: string | null
  objective: string | null
  program_type: string | null
  start_date: string | null
  end_date: string | null
  activity_date: string | null
  location: string | null
  person_in_charge_id: string | null
  requested_amount: number | null
  planned_amount: number | null
  approved_amount: number | null
  proposal_file_id: string | null
  proposal_file_name: string | null
  lpj_file_id: string | null
  lpj_file_name: string | null
  actual_amount: number | null
  status: string
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface ProgramTarget {
  id: string
  program_id: string
  target_name: string
  target_value: number | null
  actual_value: number | null
  unit: string | null
}

export interface ProgramReport {
  id: string
  program_id: string
  title: string
  summary: string | null
  period_start: string | null
  period_end: string | null
  actual_amount: number | null
  file_id: string | null
  created_at: string
}

export interface ProgramCoverage {
  fiscal_year: number
  pagu: number
  committed: number
  requested: number
  remaining: number
}

export interface ProgramDetail {
  program: Program
  targets: ProgramTarget[]
  reports: ProgramReport[]
  coverage?: ProgramCoverage
}

export interface TypeCount {
  type: string
  label: string
  count: number
  percentage: number
}

export interface MonthCount {
  month: number
  count: number
}

export interface TypeTotal {
  type: string
  label: string
  total: number
}

export interface UnitTotal {
  organization_unit_id: string
  organization_unit_name: string
  total: number
}

export interface ProgramSummary {
  year: number
  type_composition: TypeCount[]
  monthly: MonthCount[]
  grand_total: number
  totals_by_type: TypeTotal[]
  totals_by_unit: UnitTotal[]
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export const PROGRAM_TYPES: { value: string; label: string }[] = [
  { value: 'PRIORITAS', label: 'Prioritas' },
  { value: 'INISIATIF', label: 'Inisiatif' },
  { value: 'TURUNAN_DPW', label: 'Turunan DPW' },
]

export function programTypeLabel(type: string | null | undefined): string {
  return PROGRAM_TYPES.find((t) => t.value === type)?.label ?? 'Belum ditentukan'
}

export const PROGRAM_STATUSES: { value: string; label: string }[] = [
  { value: 'DRAFT', label: 'Draf' },
  { value: 'PROPOSED', label: 'Diajukan' },
  { value: 'REVISED', label: 'Direvisi' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

export const PROGRAM_TRANSITIONS: Record<string, { action: string; label: string; permission: string }[]> = {
  DRAFT: [{ action: 'submit', label: 'Ajukan', permission: 'programs:update' }],
  PROPOSED: [
    { action: 'revise', label: 'Direvisi', permission: 'programs:approve' },
    { action: 'approve', label: 'Setujui', permission: 'programs:approve' },
  ],
  REVISED: [{ action: 'submit', label: 'Ajukan', permission: 'programs:update' }],
  APPROVED: [{ action: 'complete', label: 'Selesaikan', permission: 'programs:update' }],
}

/** Statuses that may be reverted (Mundurkan Status) and the button label. */
export const PROGRAM_REVERTS: Record<string, string> = {
  CANCELLED: 'Mundurkan Status',
  COMPLETED: 'Kembalikan ke Disetujui',
}

export interface ImportResult {
  created: number
  skipped: number
  errors: { row: number; message: string }[]
}

export function programStatusLabel(status: string): string {
  return PROGRAM_STATUSES.find((s) => s.value === status)?.label ?? status
}

/** Budget shown on the list: the approved amount, falling back to the request. */
export function programBudget(program: Program): number | null {
  return program.approved_amount ?? program.requested_amount
}

/** Whether the program header is editable for the actor, by status. */
export function canEditHeader(status: string, isSuperAdmin: boolean): boolean {
  return isSuperAdmin || status === 'DRAFT' || status === 'REVISED'
}

/** Whether the Rencana Anggaran is editable for the actor, by status. */
export function canEditPlanned(status: string, isSuperAdmin: boolean): boolean {
  return canEditHeader(status, isSuperAdmin)
}

/** Truncate a filename to a maximum length, appending an ellipsis. */
export function truncateFilename(name: string | null, max = 50): string {
  if (!name) return ''
  return name.length > max ? `${name.slice(0, max)}...` : name
}

/** Whether the Proposal section is editable for the actor, by status. */
export function canEditProposal(status: string, isSuperAdmin: boolean): boolean {
  return isSuperAdmin || status === 'DRAFT' || status === 'REVISED'
}

/** Whether the LPJ section is editable for the actor, by status. */
export function canEditLpj(status: string, isSuperAdmin: boolean): boolean {
  return isSuperAdmin || status === 'APPROVED'
}

/** Whether the LPJ section is shown for the status (approved onward). */
export function lpjVisible(status: string): boolean {
  return status === 'APPROVED' || status === 'COMPLETED'
}
