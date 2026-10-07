export interface CadreLevel {
  id: string
  code: string
  name: string
  rank_order: number
}

export interface CadreProfile {
  id: string
  person_id: string
  person_code: string
  full_name: string
  current_level_id: string
  level_code: string
  level_name: string
  status: string
  started_at: string | null
  notes: string | null
  created_at: string
}

export interface CadreHistoryEntry {
  id: string
  from_level_id: string | null
  to_level_id: string
  effective_date: string | null
  approved_by: string | null
  notes: string | null
  created_at: string
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export interface Training {
  id: string
  code: string
  name: string
  description: string | null
  level_id: string | null
  status: string
  created_at: string
}

export interface Batch {
  id: string
  training_id: string
  name: string
  start_date: string | null
  end_date: string | null
  location: string | null
  status: string
  created_at: string
}

export interface Participant {
  id: string
  batch_id: string
  person_id: string
  person_code: string
  full_name: string
  status: string
}

export interface Session {
  id: string
  batch_id: string
  session_date: string | null
  topic: string | null
  facilitator: string | null
}

export interface TrainingDetail {
  training: Training
  batches: Batch[]
}

export interface BatchDetail {
  batch: Batch
  participants: Participant[]
  sessions: Session[]
}

export const CADRE_STATUSES: { value: string; label: string }[] = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'INACTIVE', label: 'Tidak aktif' },
  { value: 'GRADUATED', label: 'Lulus' },
]

export const PARTICIPANT_STATUSES: { value: string; label: string }[] = [
  { value: 'REGISTERED', label: 'Terdaftar' },
  { value: 'ATTENDED', label: 'Hadir' },
  { value: 'PASSED', label: 'Lulus' },
  { value: 'FAILED', label: 'Tidak lulus' },
  { value: 'WITHDRAWN', label: 'Mundur' },
]

export const ASSESSMENT_RESULTS: { value: string; label: string }[] = [
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'PASSED', label: 'Lulus' },
  { value: 'FAILED', label: 'Tidak lulus' },
]

export const ATTENDANCE_STATUSES: { value: string; label: string }[] = [
  { value: 'PRESENT', label: 'Hadir' },
  { value: 'ABSENT', label: 'Tidak hadir' },
  { value: 'EXCUSED', label: 'Izin' },
]

export function participantStatusLabel(status: string): string {
  return PARTICIPANT_STATUSES.find((s) => s.value === status)?.label ?? status
}
