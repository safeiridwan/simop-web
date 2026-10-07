import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useHealthStore } from './health'
import { healthApi } from '@/modules/health/api'

vi.mock('@/modules/health/api', () => ({
  healthApi: { check: vi.fn() },
}))

describe('health store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('sets ok when the API reports ok', async () => {
    vi.mocked(healthApi.check).mockResolvedValue({ status: 'ok' })
    const store = useHealthStore()

    await store.check()

    expect(store.status).toBe('ok')
  })

  it('sets error when the API call fails', async () => {
    vi.mocked(healthApi.check).mockRejectedValue(new Error('boom'))
    const store = useHealthStore()

    await store.check()

    expect(store.status).toBe('error')
  })
})
