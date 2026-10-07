import { describe, expect, it } from 'vitest'

import { participantStatusLabel } from './types'

describe('cadre type helpers', () => {
  it('labels known participant statuses', () => {
    expect(participantStatusLabel('PASSED')).toBe('Lulus')
    expect(participantStatusLabel('REGISTERED')).toBe('Terdaftar')
  })

  it('falls back to the raw value for unknown statuses', () => {
    expect(participantStatusLabel('SOMETHING')).toBe('SOMETHING')
  })
})
