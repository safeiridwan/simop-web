import { ref } from 'vue'

import { rolesApi } from '../api'
import type { Role } from '../types'

export function useRoles() {
  const roles = ref<Role[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      roles.value = await rolesApi.list()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat peran'
      roles.value = []
    } finally {
      loading.value = false
    }
  }

  return { roles, loading, error, load }
}
