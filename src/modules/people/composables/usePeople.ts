import { ref } from 'vue'

import { peopleApi } from '../api'
import type { PageMeta, Person, PersonInput } from '../types'

export function usePeople() {
  const people = ref<Person[]>([])
  const meta = ref<PageMeta | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(search = '', status = ''): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const { data, meta: pageMeta } = await peopleApi.list({ search, status })
      people.value = data
      meta.value = pageMeta ?? null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat data orang'
      people.value = []
    } finally {
      loading.value = false
    }
  }

  async function create(input: PersonInput): Promise<Person> {
    return peopleApi.create(input)
  }

  return { people, meta, loading, error, load, create }
}
