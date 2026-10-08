import { describe, expect, it } from 'vitest'

import { PROGRAM_TRANSITIONS, programStatusLabel } from './types'

describe('program type helpers', () => {
  it('labels known statuses', () => {
    expect(programStatusLabel('DRAFT')).toBe('Draf')
    expect(programStatusLabel('COMPLETED')).toBe('Selesai')
  })

  it('falls back to the raw value for unknown statuses', () => {
    expect(programStatusLabel('SOMETHING')).toBe('SOMETHING')
  })

  it('exposes transitions only for active states', () => {
    expect(PROGRAM_TRANSITIONS.DRAFT[0].action).toBe('submit')
    expect(PROGRAM_TRANSITIONS.PROPOSED[0].action).toBe('approve')
    expect(PROGRAM_TRANSITIONS.COMPLETED).toBeUndefined()
  })
})
