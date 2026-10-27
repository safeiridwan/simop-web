export interface Affiliation {
  id: string
  person_id: string
  person_code: string
  full_name: string
  affiliation_type: string
  end_date: string | null
  status: string
  source: string | null
  notes: string | null
  city_name: string | null
  district_name: string | null
  village_name: string | null
  created_at: string
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export interface AffiliationAddressInput {
  address_line?: string | null
  province_id?: string | null
  city_id?: string | null
  district_id?: string | null
  village_id?: string | null
  postal_code?: string | null
}

/** Person part of an affiliation edit; empty NIK/phone leaves them unchanged. */
export interface AffiliationPersonInput {
  full_name: string
  nik?: string
  gender?: string
  birth_place?: string
  birth_date?: string
  phone?: string
  email?: string
  status?: string
  address?: AffiliationAddressInput
}

export interface AffiliationInput {
  person_id?: string
  affiliation_type: string
  end_date?: string
  status?: string
  source?: string
  notes?: string
  person?: AffiliationPersonInput
}

export interface ImportResult {
  created: number
  skipped: number
  errors: { row: number; message: string }[]
  notices?: string[]
}

export const AFFILIATION_TYPES: { value: string; label: string; slug: string }[] = [
  { value: 'SYMPATHIZER', label: 'Simpatisan', slug: 'sympathizers' },
  { value: 'VOLUNTEER', label: 'Relawan', slug: 'volunteers' },
  { value: 'BENEFICIARY', label: 'Penerima Manfaat', slug: 'beneficiaries' },
  { value: 'EVENT_PARTICIPANT', label: 'Peserta Kegiatan', slug: 'event-participants' },
  { value: 'PROGRAM_PARTICIPANT', label: 'Peserta Program', slug: 'program-participants' },
  { value: 'OTHER', label: 'Lainnya', slug: 'other' },
]

export const AFFILIATION_STATUSES: { value: string; label: string }[] = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'INACTIVE', label: 'Tidak aktif' },
]

export function affiliationStatusLabel(status: string): string {
  return AFFILIATION_STATUSES.find((s) => s.value === status)?.label ?? status
}

export function affiliationTypeLabel(type: string): string {
  return AFFILIATION_TYPES.find((t) => t.value === type)?.label ?? type
}

export function slugToAffiliationType(slug: string): string | null {
  return AFFILIATION_TYPES.find((t) => t.slug === slug)?.value ?? null
}
