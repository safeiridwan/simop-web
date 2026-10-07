import { apiGet } from '@/services/http'
import type { Permission } from './types'

export const permissionsApi = {
  list: () => apiGet<Permission[]>('/api/v1/permissions'),
}
