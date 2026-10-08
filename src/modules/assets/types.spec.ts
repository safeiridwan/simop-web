import { describe, expect, it } from 'vitest'

import { assetConditionLabel, assetStatusLabel, ASSET_STATUSES } from './types'

describe('asset type helpers', () => {
  it('labels statuses', () => {
    expect(assetStatusLabel('AVAILABLE')).toBe('Tersedia')
    expect(assetStatusLabel('DISPOSED')).toBe('Dihapus')
  })

  it('labels conditions and falls back for unknown values', () => {
    expect(assetConditionLabel('GOOD')).toBe('Baik')
    expect(assetConditionLabel('NOPE')).toBe('NOPE')
  })

  it('exposes the status set', () => {
    expect(ASSET_STATUSES.map((s) => s.value)).toEqual(['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'DISPOSED', 'LOST'])
  })
})
