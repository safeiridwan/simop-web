import type { DashboardCounts, FinanceTotals, LevelCount, StatusCount } from './types'

// The dashboard must render even when the API returns null/partial data: every
// normalizer is total, turning missing values into 0 / [].
function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function normalizeCounts(value: Partial<DashboardCounts> | null | undefined): DashboardCounts {
  return {
    persons: num(value?.persons),
    active_members: num(value?.active_members),
    active_affiliations: num(value?.active_affiliations),
    active_cadres: num(value?.active_cadres),
    organization_units: num(value?.organization_units),
    programs: num(value?.programs),
    running_programs: num(value?.running_programs),
    activities: num(value?.activities),
    open_tasks: num(value?.open_tasks),
    planned_meetings: num(value?.planned_meetings),
    available_assets: num(value?.available_assets),
    documents: num(value?.documents),
  }
}

export function normalizeStatusCounts(value: StatusCount[] | null | undefined): StatusCount[] {
  if (!Array.isArray(value)) return []
  return value.map((row) => ({ status: String(row?.status ?? ''), count: num(row?.count) }))
}

export function normalizeLevels(value: LevelCount[] | null | undefined): LevelCount[] {
  if (!Array.isArray(value)) return []
  return value.map((row) => ({
    level_code: String(row?.level_code ?? ''),
    level_name: String(row?.level_name ?? ''),
    count: num(row?.count),
  }))
}

export function normalizeFinance(value: Partial<FinanceTotals> | null | undefined): FinanceTotals {
  return { total_debit: num(value?.total_debit), total_credit: num(value?.total_credit) }
}
