import { describe, expect, it } from 'vitest'

import { isSectionLocked, programBudget, PROGRAM_TRANSITIONS, programStatusLabel, type Program } from './types'

function program(partial: Partial<Program>): Program {
  return {
    id: 'p',
    organization_unit_id: 'u',
    organization_unit_name: 'Unit',
    program_code: 'PRG-1',
    name: 'P',
    description: null,
    objective: null,
    program_type: null,
    start_date: null,
    end_date: null,
    activity_date: null,
    location: null,
    person_in_charge_id: null,
    requested_amount: null,
    approved_amount: null,
    proposal_file_id: null,
    proposal_file_name: null,
    lpj_file_id: null,
    lpj_file_name: null,
    actual_amount: null,
    status: 'DRAFT',
    approved_at: null,
    created_at: '',
    updated_at: '',
    ...partial,
  }
}

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

  it('prefers the approved amount, falling back to the request', () => {
    expect(programBudget(program({ requested_amount: 100 }))).toBe(100)
    expect(programBudget(program({ requested_amount: 100, approved_amount: 120 }))).toBe(120)
  })

  it('locks Proposal/LPJ sections from approval onward', () => {
    expect(isSectionLocked('DRAFT')).toBe(false)
    expect(isSectionLocked('PROPOSED')).toBe(false)
    expect(isSectionLocked('APPROVED')).toBe(true)
    expect(isSectionLocked('RUNNING')).toBe(true)
    expect(isSectionLocked('COMPLETED')).toBe(true)
  })
})
