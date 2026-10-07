import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { setAccessToken } from '@/services/http'
import { authApi } from '@/modules/auth/api'
import type { AuthUser } from '@/modules/auth/types'

const SUPER_ADMIN = 'SUPER_ADMIN'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const ready = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const permissions = computed(() => user.value?.permissions ?? [])

  function can(code: string): boolean {
    if (!user.value) return false
    return user.value.roles.includes(SUPER_ADMIN) || permissions.value.includes(code)
  }

  async function login(email: string, password: string): Promise<void> {
    const result = await authApi.login(email, password)
    setAccessToken(result.access_token)
    user.value = result.user
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      user.value = null
    }
  }

  /** Resolve the session on app start: use the refresh cookie if present. */
  async function bootstrap(): Promise<void> {
    if (ready.value) return
    try {
      user.value = await authApi.me()
    } catch {
      user.value = null
    } finally {
      ready.value = true
    }
  }

  return { user, ready, isAuthenticated, permissions, can, login, logout, bootstrap }
})
