import { apiGet } from '@/services/http'
import type { Role } from './types'

export const rolesApi = {
  list: () => apiGet<Role[]>('/api/v1/roles'),
}
