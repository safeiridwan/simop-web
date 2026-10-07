import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePeople } from './usePeople'
import { peopleApi } from '../api'

vi.mock('../api', () => ({
  peopleApi: { list: vi.fn() },
}))

describe('usePeople', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads people and meta', async () => {
    vi.mocked(peopleApi.list).mockResolvedValue({
      data: [{ id: '1' } as never],
      meta: { page: 1, page_size: 20, total: 1 },
    })
    const state = usePeople()

    await state.load()

    expect(state.people.value).toHaveLength(1)
    expect(state.meta.value?.total).toBe(1)
    expect(state.loading.value).toBe(false)
  })

  it('captures the error and clears the list on failure', async () => {
    vi.mocked(peopleApi.list).mockRejectedValue(new Error('boom'))
    const state = usePeople()

    await state.load()

    expect(state.error.value).toBe('boom')
    expect(state.people.value).toEqual([])
  })
})
