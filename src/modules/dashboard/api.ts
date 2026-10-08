import { apiGet } from '@/services/http'
import type { DashboardSummary } from './types'

export const dashboardApi = {
  summary: () => apiGet<DashboardSummary>('/api/v1/dashboard/summary'),
}
