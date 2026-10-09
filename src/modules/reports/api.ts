import { apiGet, downloadFile } from '@/services/http'
import type { Dataset } from './types'

export interface ReportQuery {
  status?: string
  from?: string
  to?: string
}

function queryString(query: ReportQuery): string {
  const params = new URLSearchParams()
  if (query.status) params.set('status', query.status)
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const reportsApi = {
  get: (key: string, query: ReportQuery = {}) =>
    apiGet<Dataset>(`/api/v1/reports/${key}${queryString(query)}`),
  export: (key: string, query: ReportQuery = {}) =>
    downloadFile(`/api/v1/reports/${key}/export${queryString(query)}`, `${key}.csv`),
}
