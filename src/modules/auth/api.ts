import { apiGet, apiPost } from '@/services/http'
import type { AuthUser, LoginResult } from './types'

export const authApi = {
  login: (email: string, password: string) =>
    apiPost<LoginResult>('/api/v1/auth/login', { email, password }),
  logout: () => apiPost<{ status: string }>('/api/v1/auth/logout'),
  me: () => apiGet<AuthUser>('/api/v1/auth/me'),
}
