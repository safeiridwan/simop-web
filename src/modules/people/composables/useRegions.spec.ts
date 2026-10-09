import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRegions } from './useRegions'
import { regionsApi } from '../api'

vi.mock('../api', () => ({
  regionsApi: { provinces: vi.fn(), cities: vi.fn(), districts: vi.fn(), villages: vi.fn() },
}))

describe('useRegions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deduplicates provinces that share the same name', async () => {
    vi.mocked(regionsApi.provinces).mockResolvedValue([
      { id: '1', code: '12', name: 'Jawa Barat' },
      { id: '2', code: '32', name: 'jawa barat' },
      { id: '3', code: '31', name: 'Maluku' },
    ])
    const state = useRegions()

    await state.loadProvinces()

    expect(state.provinces.value.map((p) => p.id)).toEqual(['1', '3'])
  })

  it('clears downstream levels when the parent is emptied', async () => {
    const state = useRegions()
    state.cities.value = [{ id: 'c1', code: 'x', name: 'Kota' }]

    await state.loadCities('')

    expect(regionsApi.cities).not.toHaveBeenCalled()
    expect(state.cities.value).toEqual([])
    expect(state.districts.value).toEqual([])
    expect(state.villages.value).toEqual([])
  })
})
