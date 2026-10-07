import { ref } from 'vue'

import { permissionsApi } from '../api'
import type { Permission } from '../types'

export function usePermissions() {
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      permissions.value = await permissionsApi.list()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat izin'
      permissions.value = []
    } finally {
      loading.value = false
    }
  }

  return { permissions, loading, error, load }
}
