import { describe, expect, it } from 'vitest'

import {
  agendaColor,
  letterStatusLabel,
  renderTemplatePreview,
  romanMonth,
  truncateFilename,
  type Token,
} from './types'

describe('administration type helpers', () => {
  it('maps statuses to agenda colours', () => {
    expect(agendaColor('RELEASED')).toBe('green')
    expect(agendaColor('ON_PROGRESS')).toBe('yellow')
    expect(agendaColor('CREATED')).toBe('red')
    expect(agendaColor('REJECTED')).toBe('red')
  })

  it('labels statuses in Indonesian', () => {
    expect(letterStatusLabel('CREATED')).toBe('Draf')
    expect(letterStatusLabel('NOPE')).toBe('NOPE')
  })

  it('renders roman months', () => {
    expect(romanMonth(1)).toBe('I')
    expect(romanMonth(8)).toBe('VIII')
    expect(romanMonth(12)).toBe('XII')
  })

  it('previews a number template', () => {
    const tokens: Token[] = [
      { type: 'variable', value: 'Nomor' },
      { type: 'text', value: '/' },
      { type: 'variable', value: 'Kode' },
      { type: 'text', value: '/' },
      { type: 'variable', value: 'Bulan' },
      { type: 'text', value: '/' },
      { type: 'variable', value: 'Tahun' },
    ]
    expect(renderTemplatePreview(tokens, new Date(2025, 7, 1), 1)).toBe('001/SK/VIII/2025')
  })

  it('truncates long filenames', () => {
    expect(truncateFilename('short.pdf')).toBe('short.pdf')
    expect(truncateFilename('a'.repeat(60))).toHaveLength(53)
  })
})
