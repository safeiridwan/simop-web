import { apiGet, apiGetPage, apiPost } from '@/services/http'
import type { PageMeta, ReadinessCheck, ReadinessSummary, ScanResult } from './types'

export const electionReadinessApi = {
  summary: () => apiGet<ReadinessSummary>('/api/v1/election-readiness/summary'),
  checks: (query: { status?: string; severity?: string; ruleCode?: string } = {}) => {
    const params = new URLSearchParams({ page: '1', page_size: '100' })
    if (query.status) params.set('status', query.status)
    if (query.severity) params.set('severity', query.severity)
    if (query.ruleCode) params.set('rule_code', query.ruleCode)
    return apiGetPage<ReadinessCheck[], PageMeta>(`/api/v1/election-readiness/checks?${params.toString()}`)
  },
  scan: () => apiPost<ScanResult>('/api/v1/election-readiness/scan'),
  resolve: (id: string, status: string) =>
    apiPost<ReadinessCheck>(`/api/v1/election-readiness/checks/${id}/resolve`, { status }),
  exportUrl: '/api/v1/election-readiness/export',
}
