import { apiGet } from '@/services/http'
import type { HealthStatus } from './types'

export const healthApi = {
  check: () => apiGet<HealthStatus>('/api/v1/health'),
}
