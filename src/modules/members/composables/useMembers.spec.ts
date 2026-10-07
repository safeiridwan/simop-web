import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useMembers } from './useMembers'
import { membersApi } from '../api'

vi.mock('../api', () => ({
  membersApi: { list: vi.fn() },
}))

describe('useMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads members with meta', async () => {
    vi.mocked(membersApi.list).mockResolvedValue({
      data: [{ id: '1', member_number: 'MBR-000001' } as never],
      meta: { page: 1, page_size: 20, total: 1 },
    })
    const state = useMembers()

    await state.load()

    expect(state.members.value).toHaveLength(1)
    expect(state.meta.value?.total).toBe(1)
  })

  it('surfaces an error and clears the list', async () => {
    vi.mocked(membersApi.list).mockRejectedValue(new Error('boom'))
    const state = useMembers()

    await state.load()

    expect(state.error.value).toBe('boom')
    expect(state.members.value).toEqual([])
  })
})
