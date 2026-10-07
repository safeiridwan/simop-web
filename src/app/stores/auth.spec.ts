import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore } from './auth'
import { authApi } from '@/modules/auth/api'
import { getAccessToken } from '@/services/http'

vi.mock('@/modules/auth/api', () => ({
  authApi: { login: vi.fn(), logout: vi.fn(), me: vi.fn() },
}))

const admin = {
  id: '1',
  email: 'admin@simop.local',
  full_name: 'Admin',
  roles: ['SUPER_ADMIN'],
  permissions: [],
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('stores the token and user on login', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'tok', expires_at: '2099-01-01T00:00:00Z', user: admin })
    const auth = useAuthStore()

    await auth.login('admin@simop.local', 'Admin123!')

    expect(auth.isAuthenticated).toBe(true)
    expect(getAccessToken()).toBe('tok')
  })

  it('grants can() for SUPER_ADMIN regardless of permission list', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'tok', expires_at: '2099-01-01T00:00:00Z', user: admin })
    const auth = useAuthStore()

    await auth.login('admin@simop.local', 'Admin123!')

    expect(auth.can('anything:at:all')).toBe(true)
  })

  it('checks explicit permissions for non-super-admin', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      access_token: 'tok',
      expires_at: '2099-01-01T00:00:00Z',
      user: { ...admin, roles: ['AUDITOR'], permissions: ['users:read'] },
    })
    const auth = useAuthStore()

    await auth.login('auditor@simop.local', 'Password123!')

    expect(auth.can('users:read')).toBe(true)
    expect(auth.can('users:update')).toBe(false)
  })

  it('clears the session on logout', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'tok', expires_at: '2099-01-01T00:00:00Z', user: admin })
    vi.mocked(authApi.logout).mockResolvedValue({ status: 'logged_out' })
    const auth = useAuthStore()
    await auth.login('admin@simop.local', 'Admin123!')

    await auth.logout()

    expect(auth.isAuthenticated).toBe(false)
    expect(getAccessToken()).toBeNull()
  })
})
