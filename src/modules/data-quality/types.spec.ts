import { describe, expect, it } from 'vitest'

import { ruleLabel, severityLabel, ISSUE_STATUSES } from './types'

describe('data-quality type helpers', () => {
  it('labels rules', () => {
    expect(ruleLabel('MISSING_ADDRESS')).toBe('Alamat kosong')
    expect(ruleLabel('UNKNOWN_RULE')).toBe('UNKNOWN_RULE')
  })

  it('labels severities', () => {
    expect(severityLabel('HIGH')).toBe('Tinggi')
    expect(severityLabel('NOPE')).toBe('NOPE')
  })

  it('exposes the issue status set', () => {
    expect(ISSUE_STATUSES.map((s) => s.value)).toEqual(['OPEN', 'RESOLVED', 'IGNORED'])
  })
})
