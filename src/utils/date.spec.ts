import { describe, expect, it } from 'vitest'

import { formatDate, formatDateRange } from './date'

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

describe('formatDateRange', () => {
  it('shows a single date when start equals end', () => {
    expect(formatDateRange('2026-01-01', '2026-01-01')).toBe('01-01-2026')
  })

  it('shows a range for different dates', () => {
    expect(formatDateRange('2026-01-01', '2026-12-31')).toBe('01-01-2026 s/d 31-12-2026')
  })

  it('falls back to the available edge or a dash', () => {
    expect(formatDateRange('2026-01-01', null)).toBe('01-01-2026')
    expect(formatDateRange(null, '2026-12-31')).toBe('31-12-2026')
    expect(formatDateRange(null, null)).toBe('—')
  })
})
