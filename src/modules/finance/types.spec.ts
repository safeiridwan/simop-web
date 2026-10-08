import { describe, expect, it } from 'vitest'

import { accountTypeLabel, JOURNAL_TRANSITIONS, REIMBURSEMENT_TRANSITIONS } from './types'

describe('finance type helpers', () => {
  it('labels account types', () => {
    expect(accountTypeLabel('ASSET')).toBe('Aset')
    expect(accountTypeLabel('EXPENSE')).toBe('Beban')
  })

  it('falls back to the raw value for unknown account types', () => {
    expect(accountTypeLabel('NOPE')).toBe('NOPE')
  })

  it('exposes journal and reimbursement transitions', () => {
    expect(JOURNAL_TRANSITIONS.DRAFT.map((t) => t.action)).toContain('submit')
    expect(JOURNAL_TRANSITIONS.APPROVED[0].action).toBe('post')
    expect(REIMBURSEMENT_TRANSITIONS.SUBMITTED.map((t) => t.action)).toEqual(['approve', 'reject'])
    expect(REIMBURSEMENT_TRANSITIONS.PAID).toBeUndefined()
  })
})
