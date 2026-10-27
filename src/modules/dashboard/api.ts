import { apiGet } from '@/services/http'
import { normalizeCounts, normalizeFinance, normalizeLevels, normalizeStatusCounts } from './normalize'
import type { DashboardSummary, DashboardSection } from './types'

export const dashboardApi = {
  summary: async (): Promise<DashboardSummary> => {
    const raw = await apiGet<DashboardSummary | null>('/api/v1/dashboard/summary')
    return {
      counts: normalizeCounts(raw?.counts),
      membership_by_status: normalizeStatusCounts(raw?.membership_by_status),
      cadre_by_level: normalizeLevels(raw?.cadre_by_level),
      programs_by_status: normalizeStatusCounts(raw?.programs_by_status),
      finance_totals: normalizeFinance(raw?.finance_totals),
    }
  },
  /** Load one block so each section can fail and retry on its own. */
  section: async (section: DashboardSection): Promise<Partial<DashboardSummary>> => {
    const raw = await apiGet<Partial<DashboardSummary> | null>(
      `/api/v1/dashboard/summary?section=${encodeURIComponent(section)}`,
    )
    switch (section) {
      case 'counts':
        return { counts: normalizeCounts(raw?.counts) }
      case 'cadre_by_level':
        return { cadre_by_level: normalizeLevels(raw?.cadre_by_level) }
      case 'programs_by_status':
        return { programs_by_status: normalizeStatusCounts(raw?.programs_by_status) }
      case 'finance_totals':
        return { finance_totals: normalizeFinance(raw?.finance_totals) }
      case 'membership_by_status':
        return { membership_by_status: normalizeStatusCounts(raw?.membership_by_status) }
    }
  },
}
