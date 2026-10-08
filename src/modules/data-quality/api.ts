import { apiGet, apiGetPage, apiPost } from '@/services/http'
import type { DataQualityIssue, PageMeta, ScanResult, SummaryRow } from './types'

export const dataQualityApi = {
  issues: (query: { status?: string; severity?: string; ruleCode?: string } = {}) => {
    const params = new URLSearchParams({ page: '1', page_size: '100' })
    if (query.status) params.set('status', query.status)
    if (query.severity) params.set('severity', query.severity)
    if (query.ruleCode) params.set('rule_code', query.ruleCode)
    return apiGetPage<DataQualityIssue[], PageMeta>(`/api/v1/data-quality/issues?${params.toString()}`)
  },
  summary: () => apiGet<SummaryRow[]>('/api/v1/data-quality/summary'),
  scan: () => apiPost<ScanResult>('/api/v1/data-quality/scan'),
  resolve: (id: string, status: string) =>
    apiPost<DataQualityIssue>(`/api/v1/data-quality/issues/${id}/resolve`, { status }),
}
