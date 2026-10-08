import { describe, expect, it } from 'vitest'

import { checkLabel, CHECK_LABELS, ISSUE_STATUSES } from './types'

describe('election readiness type helpers', () => {
  it('labels readiness checks', () => {
    expect(checkLabel('ER_OFFICER_COMPLETENESS')).toBe('Kelengkapan Pengurus')
    expect(checkLabel('UNKNOWN')).toBe('UNKNOWN')
  })

  it('exposes all seven checks', () => {
    expect(Object.keys(CHECK_LABELS)).toHaveLength(7)
  })

  it('exposes the issue status set', () => {
    expect(ISSUE_STATUSES.map((s) => s.value)).toEqual(['OPEN', 'RESOLVED', 'IGNORED'])
  })
})
