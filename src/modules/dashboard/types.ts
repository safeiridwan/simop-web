export interface DashboardCounts {
  persons: number
  active_members: number
  active_affiliations: number
  active_cadres: number
  organization_units: number
  programs: number
  running_programs: number
  activities: number
  open_tasks: number
  planned_meetings: number
  available_assets: number
  documents: number
}

export interface StatusCount {
  status: string
  count: number
}

export interface LevelCount {
  level_code: string
  level_name: string
  count: number
}

export interface DashboardSummary {
  counts: DashboardCounts
  membership_by_status: StatusCount[]
  cadre_by_level: LevelCount[]
  programs_by_status: StatusCount[]
  finance_totals: { total_debit: number; total_credit: number }
}
