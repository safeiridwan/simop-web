import { describe, expect, it } from 'vitest'

import { groupStatusLabel, taklimatStatusLabel, truncateFilename, truncateText } from './types'

describe('kaderisasi type helpers', () => {
  it('labels taklimat statuses', () => {
    expect(taklimatStatusLabel('DRAFT')).toBe('Draft')
    expect(taklimatStatusLabel('PUBLISHED')).toBe('Published')
    expect(taklimatStatusLabel('UNPUBLISHED')).toBe('Unpublished')
    expect(taklimatStatusLabel('NOPE')).toBe('NOPE')
  })

  it('labels group statuses', () => {
    expect(groupStatusLabel('ACTIVE')).toBe('Aktif')
    expect(groupStatusLabel('INACTIVE')).toBe('Tidak Aktif')
  })

  it('truncates long filenames', () => {
    expect(truncateFilename('a'.repeat(60))).toHaveLength(53)
  })
})

describe('truncateText', () => {
  it('keeps short text and trims long text', () => {
    expect(truncateText(null)).toBe('')
    expect(truncateText('pendek')).toBe('pendek')
    const long = 'a'.repeat(70)
    expect(truncateText(long)).toBe(`${'a'.repeat(60)}...`)
  })
})
