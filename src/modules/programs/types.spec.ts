import { describe, expect, it } from 'vitest'

import {
  canEditLpj,
  canEditProposal,
  lpjVisible,
  programBudget,
  PROGRAM_TRANSITIONS,
  programStatusLabel,
  truncateFilename,
  type Program,
} from './types'

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
    expect(PROGRAM_TRANSITIONS.PROPOSED.map((t) => t.action)).toEqual(['revise', 'approve'])
    expect(PROGRAM_TRANSITIONS.REVISED[0].action).toBe('submit')
    expect(PROGRAM_TRANSITIONS.APPROVED[0].action).toBe('complete')
    expect(PROGRAM_TRANSITIONS.COMPLETED).toBeUndefined()
  })

  it('prefers the approved amount, falling back to the request', () => {
    expect(programBudget(program({ requested_amount: 100 }))).toBe(100)
    expect(programBudget(program({ requested_amount: 100, approved_amount: 120 }))).toBe(120)
  })

  it('truncates filenames over the limit and keeps short ones', () => {
    const short = 'lpj.pdf'
    expect(truncateFilename(short)).toBe(short)
    const long = 'a'.repeat(60)
    const truncated = truncateFilename(long)
    expect(truncated.length).toBe(53)
    expect(truncated.endsWith('...')).toBe(true)
    expect(truncateFilename(null)).toBe('')
  })

  it('locks Proposal to Draft/Revised and LPJ to Approved (with super admin override)', () => {
    expect(canEditProposal('DRAFT', false)).toBe(true)
    expect(canEditProposal('REVISED', false)).toBe(true)
    expect(canEditProposal('PROPOSED', false)).toBe(false)
    expect(canEditProposal('APPROVED', false)).toBe(false)
    expect(canEditProposal('APPROVED', true)).toBe(true)

    expect(canEditLpj('APPROVED', false)).toBe(true)
    expect(canEditLpj('PROPOSED', false)).toBe(false)
    expect(canEditLpj('COMPLETED', false)).toBe(false)
    expect(canEditLpj('COMPLETED', true)).toBe(true)
  })

  it('shows the LPJ section from approval onward', () => {
    expect(lpjVisible('DRAFT')).toBe(false)
    expect(lpjVisible('PROPOSED')).toBe(false)
    expect(lpjVisible('APPROVED')).toBe(true)
    expect(lpjVisible('COMPLETED')).toBe(true)
  })
})
