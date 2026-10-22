import { describe, expect, it } from 'vitest'

import { formatCurrencyInput, formatRupiah, parseCurrencyInput } from './currency'

describe('currency helpers', () => {
  it('formats rupiah with a dash for empty values', () => {
    expect(formatRupiah(null)).toBe('-')
    expect(formatRupiah(undefined)).toBe('-')
    expect(formatRupiah(2000000)).toBe('Rp 2.000.000')
    expect(formatRupiah(0)).toBe('Rp 0')
  })

  it('parses masked input back to a plain number', () => {
    expect(parseCurrencyInput('2.000.000')).toBe(2000000)
    expect(parseCurrencyInput('Rp 1.500.000')).toBe(1500000)
    expect(parseCurrencyInput('2.000.000,50')).toBe(2000000.5)
    expect(parseCurrencyInput('')).toBeNull()
    expect(Number.isNaN(parseCurrencyInput('abc'))).toBe(true)
  })

  it('round-trips values without changing them', () => {
    for (const value of [0, 1, 999, 1500, 2000000, 2000000.5]) {
      expect(parseCurrencyInput(formatCurrencyInput(value))).toBe(value)
      expect(parseCurrencyInput(formatRupiah(value).replace('Rp ', ''))).toBe(value)
    }
  })
})
