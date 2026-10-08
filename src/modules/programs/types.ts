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
  person_in_charge_id: string | null
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
  unit: string | null
}

export interface ProgramIndicator {
  id: string
  program_id: string
  indicator_name: string
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
  created_at: string
}

export interface ProgramDetail {
  program: Program
  targets: ProgramTarget[]
  indicators: ProgramIndicator[]
  reports: ProgramReport[]
}

export interface Activity {
  id: string
  program_id: string | null
  program_name: string | null
  organization_unit_id: string
  organization_unit_name: string
  name: string
  description: string | null
  activity_date: string | null
  location: string | null
  person_in_charge_id: string | null
  status: string
  created_at: string
}

export interface ActivityParticipant {
  id: string
  activity_id: string
  person_id: string
  person_code: string
  full_name: string
  participant_type: string
}

export interface ActivityAttendance {
  id: string
  activity_id: string
  person_id: string
  person_code: string
  full_name: string
  attendance_at: string | null
  method: string | null
  status: string
  notes: string | null
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export const PROGRAM_STATUSES: { value: string; label: string }[] = [
  { value: 'DRAFT', label: 'Draf' },
  { value: 'PROPOSED', label: 'Diajukan' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'RUNNING', label: 'Berjalan' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

export const PROGRAM_TRANSITIONS: Record<string, { action: string; label: string; permission: string }[]> = {
  DRAFT: [{ action: 'submit', label: 'Ajukan', permission: 'programs:update' }],
  PROPOSED: [{ action: 'approve', label: 'Setujui', permission: 'programs:approve' }],
  APPROVED: [{ action: 'start', label: 'Mulai', permission: 'programs:update' }],
  RUNNING: [{ action: 'complete', label: 'Selesaikan', permission: 'programs:update' }],
}

export const PARTICIPANT_TYPES: { value: string; label: string }[] = [
  { value: 'PARTICIPANT', label: 'Peserta' },
  { value: 'SPEAKER', label: 'Pembicara' },
  { value: 'COMMITTEE', label: 'Panitia' },
  { value: 'GUEST', label: 'Tamu' },
]

export const ATTENDANCE_STATUSES: { value: string; label: string }[] = [
  { value: 'PRESENT', label: 'Hadir' },
  { value: 'ABSENT', label: 'Tidak hadir' },
  { value: 'EXCUSED', label: 'Izin' },
]

export function programStatusLabel(status: string): string {
  return PROGRAM_STATUSES.find((s) => s.value === status)?.label ?? status
}
