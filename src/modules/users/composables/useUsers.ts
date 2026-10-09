import { ref } from 'vue'

import { usersApi } from '../api'
import type { CreateUserInput, PageMeta, User } from '../types'

export function useUsers() {
  const users = ref<User[]>([])
  const meta = ref<PageMeta | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(search = '', page = 1): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const { data, meta: pageMeta } = await usersApi.list({ search, page })
      users.value = data
      meta.value = pageMeta ?? null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat data pengguna'
      users.value = []
    } finally {
      loading.value = false
    }
  }

  async function create(input: CreateUserInput): Promise<void> {
    await usersApi.create(input)
    await load()
  }

  return { users, meta, loading, error, load, create }
}
