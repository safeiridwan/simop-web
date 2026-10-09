import { apiGet, apiPut } from '@/services/http'
import type { Setting } from './types'

export const settingsApi = {
  list: () => apiGet<Setting[]>('/api/v1/settings'),
  upsert: (key: string, value: string) =>
    apiPut<Setting>(`/api/v1/settings/${encodeURIComponent(key)}`, { value }),
}
