export interface UnitType {
  id: string
  code: string
  name: string
  rank_order: number
  allowed_parent_type_ids: string[]
}

export interface Unit {
  id: string
  parent_id: string | null
  unit_type_id: string
  unit_type_code: string
  code: string
  name: string
  province_id: string | null
  city_id: string | null
  district_id: string | null
  village_id: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface UnitNode extends Unit {
  children: UnitNode[]
}

export interface Position {
  id: string
  organization_unit_id: string
  position_name: string
  position_code: string
  max_members: number | null
  is_active: boolean
  created_at: string
}

export interface Period {
  id: string
  organization_unit_id: string
  name: string
  start_date: string | null
  end_date: string | null
  status: string
  created_at: string
}

export interface Officer {
  id: string
  organization_unit_id: string
  person_id: string
  person_code: string
  full_name: string
  position_id: string
  position_name: string
  position_code: string
  organization_period_id: string | null
  start_date: string | null
  end_date: string | null
  status: string
  created_at: string
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export interface CreateUnitInput {
  parent_id?: string | null
  unit_type_id: string
  code: string
  name: string
  status?: string
}
