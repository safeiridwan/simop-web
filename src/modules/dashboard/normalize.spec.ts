import { describe, expect, it } from 'vitest'

import { normalizeCounts, normalizeFinance, normalizeLevels, normalizeStatusCounts } from './normalize'

describe('dashboard normalizers', () => {
  it('turns null/undefined into zeros and empty arrays', () => {
    const counts = normalizeCounts(null)
    expect(Object.values(counts).every((v) => v === 0)).toBe(true)
    expect(normalizeLevels(undefined)).toEqual([])
    expect(normalizeStatusCounts(null)).toEqual([])
    expect(normalizeFinance(null)).toEqual({ total_debit: 0, total_credit: 0 })
  })

  it('coerces non-numeric counts to 0 instead of NaN', () => {
    expect(normalizeCounts({ persons: 'x' as never }).persons).toBe(0)
    expect(normalizeLevels([{ level_code: 'MULA', level_name: 'Mula', count: '3' as never }])[0].count).toBe(3)
  })
})
