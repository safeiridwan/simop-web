import { apiGetPage } from '@/services/http'
import type { PageMeta, SecurityEvent } from './types'

export const securityApi = {
  events: (eventType = '', page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (eventType) params.set('event_type', eventType)
    return apiGetPage<SecurityEvent[], PageMeta>(`/api/v1/security/events?${params.toString()}`)
  },
}
