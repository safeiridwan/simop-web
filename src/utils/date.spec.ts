import { describe, expect, it } from 'vitest'

import { formatDate } from './date'

describe('formatDate', () => {
  it('formats a date-only string as dd-MM-yyyy', () => {
    expect(formatDate('2025-08-27')).toBe('27-08-2025')
  })

  it('formats a full ISO timestamp using its date part', () => {
    expect(formatDate('2025-08-27T23:30:00Z')).toBe('27-08-2025')
  })

  it('does not shift the day across timezones for date-only values', () => {
    expect(formatDate('2025-01-01')).toBe('01-01-2025')
  })

  it('returns an em dash for empty values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('')).toBe('—')
  })

  it('returns the raw value when it cannot be parsed', () => {
    expect(formatDate('bukan-tanggal')).toBe('bukan-tanggal')
  })

  it('formats a Date object with local parts', () => {
    expect(formatDate(new Date(2025, 0, 5))).toBe('05-01-2025')
  })
})
