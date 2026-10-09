import { describe, expect, it } from 'vitest'

import { REPORT_KEYS } from './types'

describe('report keys', () => {
  it('exposes the non-finance reports', () => {
    expect(REPORT_KEYS.map((r) => r.key)).toEqual([
      'members',
      'cadres',
      'organization',
      'programs',
      'activities',
      'assets',
      'audit',
    ])
  })
})
