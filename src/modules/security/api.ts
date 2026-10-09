import { apiGetPage } from '@/services/http'
import type { PageMeta, SecurityEvent } from './types'

export const securityApi = {
  events: (eventType = '') => {
    const params = new URLSearchParams({ page: '1', page_size: '100' })
    if (eventType) params.set('event_type', eventType)
    return apiGetPage<SecurityEvent[], PageMeta>(`/api/v1/security/events?${params.toString()}`)
  },
}
