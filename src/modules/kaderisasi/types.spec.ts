import { describe, expect, it } from 'vitest'

import {
  attendanceCellState,
  attendanceMonthKey,
  attendanceMonthLabel,
  groupAttendanceByMonth,
  groupStatusLabel,
  taklimatStatusLabel,
  truncateFilename,
  truncateText,
  type AttendanceMemberRow,
  type AttendanceSessionRow,
} from './types'

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

function session(id: string, session_date: string): AttendanceSessionRow {
  return { id, session_date, material: '' }
}

function member(overrides: Partial<AttendanceMemberRow> = {}): AttendanceMemberRow {
  return {
    member_id: 'm1',
    cadre_profile_id: 'c1',
    full_name: 'Ahmad',
    person_code: 'PSN-000001',
    joined_at: '2026-01-01',
    attended: 0,
    total_meetings: 0,
    percentage: 0,
    attended_session_ids: [],
    ...overrides,
  }
}

describe('attendanceMonthKey / label', () => {
  it('buckets edge-of-month dates without timezone shifts', () => {
    expect(attendanceMonthKey('2026-01-31')).toBe('2026-01')
    expect(attendanceMonthKey('2026-02-01')).toBe('2026-02')
    expect(attendanceMonthKey('2025-12-31')).toBe('2025-12')
    expect(attendanceMonthKey('2026-01-01')).toBe('2026-01')
    expect(attendanceMonthKey('')).toBeNull()
  })

  it('labels months in Indonesian with the year', () => {
    expect(attendanceMonthLabel('2026-01')).toBe('Januari 2026')
    expect(attendanceMonthLabel('2025-12')).toBe('Desember 2025')
  })
})

describe('groupAttendanceByMonth', () => {
  it('groups across months and years, newest month first, dates ascending', () => {
    const months = groupAttendanceByMonth(
      [
        session('s4', '2026-02-10'),
        session('s1', '2025-12-31'),
        session('s2', '2026-01-31'),
        session('s3', '2026-01-05'),
        session('s5', '2026-01-15'),
      ],
      [member()],
    )

    expect(months.map((m) => m.label)).toEqual(['Februari 2026', 'Januari 2026', 'Desember 2025'])
    expect(months[1].sessions.map((s) => s.session_date)).toEqual(['2026-01-05', '2026-01-15', '2026-01-31'])
    expect(months[0].meeting_count).toBe(1)
  })

  it('returns one month with five meetings as a single group', () => {
    const months = groupAttendanceByMonth(
      [session('a', '2026-01-06'), session('b', '2026-01-13'), session('c', '2026-01-20'), session('d', '2026-01-27'), session('e', '2026-01-30')],
      [member()],
    )
    expect(months).toHaveLength(1)
    expect(months[0].meeting_count).toBe(5)
    expect(months[0].sessions).toHaveLength(5)
  })

  it('covers a full year of meetings and skips months without meetings', () => {
    const sessions = ['01', '03', '05', '07', '09', '11'].map((month, i) =>
      session(`s${i}`, `2026-${month}-15`),
    )
    const months = groupAttendanceByMonth(sessions, [member()])
    expect(months).toHaveLength(6)
    expect(months.map((m) => m.key)).toEqual(['2026-11', '2026-09', '2026-07', '2026-05', '2026-03', '2026-01'])
    expect(months.some((m) => m.key === '2026-02')).toBe(false)
  })

  it('computes the month average with the existing metric rule', () => {
    const sessions = [session('s1', '2026-01-05'), session('s2', '2026-01-12')]
    const members = [
      member({ member_id: 'm1', attended_session_ids: ['s1', 's2'] }),
      member({ member_id: 'm2', attended_session_ids: ['s1'] }),
      member({ member_id: 'm3', joined_at: '2026-01-12' }),
    ]
    const [january] = groupAttendanceByMonth(sessions, members)
    // m1 100, m2 50, m3 0/1 = 0 -> average 50.0
    expect(january.average_percentage).toBe(50)
  })
})

describe('attendanceCellState', () => {
  it('marks present, absent, and not applicable per the metric rule', () => {
    const sessions = [session('s1', '2026-01-05'), session('s2', '2026-01-12')]
    const person = member({ joined_at: '2026-01-10' })

    expect(attendanceCellState(person, sessions[0])).toBe('not_applicable')
    expect(attendanceCellState(person, sessions[1])).toBe('absent')
    expect(attendanceCellState({ ...person, attended_session_ids: ['s1'] }, sessions[0])).toBe('present')
  })
})
