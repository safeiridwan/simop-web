import { describe, expect, it } from 'vitest'

import { eventTypeLabel, EVENT_TYPES } from './types'

describe('security type helpers', () => {
  it('labels known event types', () => {
    expect(eventTypeLabel('LOGIN_SUCCESS')).toBe('Login sukses')
    expect(eventTypeLabel('LOGIN_LOCKED')).toBe('Akun terkunci')
  })

  it('falls back to the raw value for unknown types', () => {
    expect(eventTypeLabel('NOPE')).toBe('NOPE')
  })

  it('exposes the filter set', () => {
    expect(EVENT_TYPES[0].value).toBe('')
  })
})
