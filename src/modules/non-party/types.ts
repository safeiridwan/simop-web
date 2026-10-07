export interface Affiliation {
  id: string
  person_id: string
  person_code: string
  full_name: string
  affiliation_type: string
  start_date: string | null
  end_date: string | null
  status: string
  source: string | null
  notes: string | null
  created_at: string
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export interface AffiliationInput {
  person_id: string
  affiliation_type: string
  start_date?: string
  end_date?: string
  status?: string
  source?: string
  notes?: string
}

export const AFFILIATION_TYPES: { value: string; label: string; slug: string }[] = [
  { value: 'SYMPATHIZER', label: 'Simpatisan', slug: 'sympathizers' },
  { value: 'VOLUNTEER', label: 'Relawan', slug: 'volunteers' },
  { value: 'BENEFICIARY', label: 'Penerima Manfaat', slug: 'beneficiaries' },
  { value: 'EVENT_PARTICIPANT', label: 'Peserta Kegiatan', slug: 'event-participants' },
  { value: 'PROGRAM_PARTICIPANT', label: 'Peserta Program', slug: 'program-participants' },
  { value: 'OTHER', label: 'Lainnya', slug: 'other' },
]

export function affiliationTypeLabel(type: string): string {
  return AFFILIATION_TYPES.find((t) => t.value === type)?.label ?? type
}

export function slugToAffiliationType(slug: string): string | null {
  return AFFILIATION_TYPES.find((t) => t.slug === slug)?.value ?? null
}
