import { describe, expect, it } from 'vitest'

import { meetingStatusLabel, taskPriorityLabel, ITEM_STATUSES } from './types'

describe('governance type helpers', () => {
  it('labels meeting statuses', () => {
    expect(meetingStatusLabel('COMPLETED')).toBe('Selesai')
    expect(meetingStatusLabel('UNKNOWN')).toBe('UNKNOWN')
  })

  it('labels task priorities', () => {
    expect(taskPriorityLabel('URGENT')).toBe('Mendesak')
    expect(taskPriorityLabel('NOPE')).toBe('NOPE')
  })

  it('exposes the item status set', () => {
    expect(ITEM_STATUSES.map((s) => s.value)).toEqual(['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
  })
})
