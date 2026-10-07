import { describe, expect, it } from 'vitest'

import { affiliationTypeLabel, slugToAffiliationType } from './types'

describe('affiliation type helpers', () => {
  it('maps known slugs to types', () => {
    expect(slugToAffiliationType('sympathizers')).toBe('SYMPATHIZER')
    expect(slugToAffiliationType('volunteers')).toBe('VOLUNTEER')
    expect(slugToAffiliationType('beneficiaries')).toBe('BENEFICIARY')
  })

  it('returns null for unknown slugs', () => {
    expect(slugToAffiliationType('nope')).toBeNull()
  })

  it('labels known types and falls back to the raw value', () => {
    expect(affiliationTypeLabel('VOLUNTEER')).toBe('Relawan')
    expect(affiliationTypeLabel('SOMETHING')).toBe('SOMETHING')
  })
})
