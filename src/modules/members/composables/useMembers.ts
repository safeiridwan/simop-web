import { ref } from 'vue'

import { membersApi, type ListMembersQuery } from '../api'
import type { PageMeta, Member } from '../types'

export function useMembers() {
  const members = ref<Member[]>([])
  const meta = ref<PageMeta | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(query: ListMembersQuery = {}): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const { data, meta: pageMeta } = await membersApi.list({ page: 1, pageSize: 10, ...query })
      members.value = data
      meta.value = pageMeta ?? null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat data anggota'
      members.value = []
    } finally {
      loading.value = false
    }
  }

  return { members, meta, loading, error, load }
}
