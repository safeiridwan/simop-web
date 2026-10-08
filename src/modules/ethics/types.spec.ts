import { describe, expect, it } from 'vitest'

import { ethicsStatusLabel, ETHICS_STATUSES } from './types'

describe('ethics type helpers', () => {
  it('labels case statuses', () => {
    expect(ethicsStatusLabel('REPORTED')).toBe('Dilaporkan')
    expect(ethicsStatusLabel('DISMISSED')).toBe('Dibatalkan')
  })

  it('falls back to the raw value for unknown statuses', () => {
    expect(ethicsStatusLabel('NOPE')).toBe('NOPE')
  })

  it('exposes the full case lifecycle', () => {
    expect(ETHICS_STATUSES.map((s) => s.value)).toEqual([
      'REPORTED',
      'UNDER_REVIEW',
      'INVESTIGATION',
      'HEARING',
      'DECIDED',
      'CLOSED',
      'DISMISSED',
    ])
  })
})
