import { apiGet, downloadFile } from '@/services/http'
import type { Dataset } from './types'

export const reportsApi = {
  get: (key: string, status = '') =>
    apiGet<Dataset>(`/api/v1/reports/${key}${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  export: (key: string, status = '') =>
    downloadFile(
      `/api/v1/reports/${key}/export${status ? `?status=${encodeURIComponent(status)}` : ''}`,
      `${key}.csv`,
    ),
}
