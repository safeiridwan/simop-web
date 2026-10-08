export interface EthicsCase {
  id: string
  case_number: string
  title: string
  description: string | null
  organization_unit_id: string | null
  subject_person_id: string | null
  status: string
  confidentiality: string
  closed_at: string | null
  created_at: string
}

export interface EthicsReport {
  id: string
  case_id: string
  reporter_id: string | null
  content: string
  is_anonymous: boolean
  created_at: string
}

export interface EthicsInvestigation {
  id: string
  case_id: string
  investigator_id: string | null
  findings: string | null
  status: string
  started_at: string | null
  completed_at: string | null
}

export interface EthicsEvidence {
  id: string
  case_id: string
  description: string
  file_id: string | null
  created_at: string
}

export interface EthicsHearing {
  id: string
  case_id: string
  scheduled_at: string | null
  location: string | null
  notes: string | null
  status: string
}

export interface EthicsDecision {
  id: string
  case_id: string
  decision_number: string | null
  decision_text: string
  decided_at: string | null
  created_at: string
}

export interface EthicsSanction {
  id: string
  decision_id: string
  sanction_type: string
  description: string | null
  effective_at: string | null
}

export interface EthicsCaseDetail {
  case: EthicsCase
  reports: EthicsReport[]
  investigations: EthicsInvestigation[]
  evidence: EthicsEvidence[]
  hearings: EthicsHearing[]
  decisions: EthicsDecision[]
  sanctions: EthicsSanction[]
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export const ETHICS_STATUSES = [
  { value: 'REPORTED', label: 'Dilaporkan' },
  { value: 'UNDER_REVIEW', label: 'Ditinjau' },
  { value: 'INVESTIGATION', label: 'Investigasi' },
  { value: 'HEARING', label: 'Sidang' },
  { value: 'DECIDED', label: 'Diputuskan' },
  { value: 'CLOSED', label: 'Ditutup' },
  { value: 'DISMISSED', label: 'Dibatalkan' },
]

export const HEARING_STATUSES = [
  { value: 'SCHEDULED', label: 'Dijadwalkan' },
  { value: 'HELD', label: 'Digelar' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

export function ethicsStatusLabel(status: string): string {
  return ETHICS_STATUSES.find((s) => s.value === status)?.label ?? status
}
