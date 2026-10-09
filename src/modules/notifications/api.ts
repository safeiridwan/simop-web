import { apiGet, apiGetPage, apiPatch, apiPost } from '@/services/http'
import type { Notification, PageMeta, Preference } from './types'

export const notificationsApi = {
  list: (query: { status?: string } = {}) => {
    const params = new URLSearchParams({ page: '1', page_size: '50' })
    if (query.status) params.set('status', query.status)
    return apiGetPage<Notification[], PageMeta>(`/api/v1/notifications?${params.toString()}`)
  },
  unreadCount: () => apiGet<{ unread: number }>('/api/v1/notifications/unread-count'),
  markRead: (id: string) => apiPost<Notification>(`/api/v1/notifications/${id}/read`),
  markAllRead: () => apiPost<{ marked: number }>('/api/v1/notifications/read-all'),
  preferences: () => apiGet<Preference[]>('/api/v1/notification-preferences'),
  setPreference: (category: string, channel: string, enabled: boolean) =>
    apiPatch<Preference>('/api/v1/notification-preferences', { category, channel, enabled }),
}
