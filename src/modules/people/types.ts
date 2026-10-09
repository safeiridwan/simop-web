export interface Person {
  id: string
  person_code: string
  full_name: string
  nik_masked: string
  gender: string
  birth_place: string
  birth_date: string | null
  phone_masked: string
  email: string
  status: string
  created_at: string
  updated_at: string
}

export interface PersonInput {
  full_name: string
  nik?: string
  gender?: string
  birth_place?: string
  birth_date?: string
  phone?: string
  email?: string
  status?: string
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export interface Region {
  id: string
  code: string
  name: string
  type?: string
}

export interface Address {
  id: string
  person_id: string
  address_type: string
  address_line: string | null
  province_id: string | null
  city_id: string | null
  district_id: string | null
  village_id: string | null
  postal_code: string | null
  is_primary: boolean
}

export interface AddressInput {
  address_type: string
  address_line?: string
  province_id?: string | null
  city_id?: string | null
  district_id?: string | null
  village_id?: string | null
  postal_code?: string
  is_primary: boolean
}

export interface PersonDocument {
  id: string
  person_id: string
  document_type: string
  document_number: string | null
  file_id: string | null
  created_at: string
}

export interface DocumentInput {
  document_type: string
  document_number?: string | null
  file_id?: string | null
}
