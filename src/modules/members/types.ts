export interface Member {
  id: string
  person_id: string
  person_code: string
  full_name: string
  member_number: string
  join_date: string | null
  status: string
  membership_source: string | null
  verified_at: string | null
  resigned_at: string | null
  created_at: string
  updated_at: string
}

export interface MemberHistory {
  id: string
  old_status: string | null
  new_status: string
  reason: string | null
  effective_at: string
  created_by: string | null
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export interface CreateMemberInput {
  person_id: string
  join_date?: string
  membership_source?: string
}

export const MEMBER_STATUSES: { value: string; label: string }[] = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'INACTIVE', label: 'Tidak aktif' },
  { value: 'SUSPENDED', label: 'Ditangguhkan' },
  { value: 'RESIGNED', label: 'Keluar' },
  { value: 'DECEASED', label: 'Meninggal' },
]

export function memberStatusLabel(status: string): string {
  return MEMBER_STATUSES.find((s) => s.value === status)?.label ?? status
}
