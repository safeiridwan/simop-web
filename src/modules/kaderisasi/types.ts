export interface Level {
  id: string
  code: string
  name: string
  rank_order: number
}

export interface Taklimat {
  id: string
  title: string
  publish_date: string | null
  status: string
  content_html: string | null
  targets: Level[]
  created_at: string
}

export interface CoachingGroup {
  id: string
  name: string
  murabbi: string
  murabbi_cadre_profile_id: string | null
  level_id: string | null
  level_code: string | null
  level_name: string | null
  status: string
  formed_at: string | null
  member_count: number
  created_at: string
}

export interface GroupMember {
  id: string
  cadre_profile_id: string
  full_name: string
  person_code: string
  level_code: string
  level_name: string
  status: string
}

export interface GroupDetail {
  group: CoachingGroup
  members: GroupMember[]
}

/** Editable member row used by the group form/editor. */
export interface GroupMemberRow {
  cadre_profile_id: string
  full_name: string
  person_code: string
  level_name: string
  status: string
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export const TAKLIMAT_STATUSES: { value: string; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'UNPUBLISHED', label: 'Unpublished' },
]

export const GROUP_STATUSES: { value: string; label: string }[] = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'INACTIVE', label: 'Tidak Aktif' },
]

export function taklimatStatusLabel(status: string): string {
  return TAKLIMAT_STATUSES.find((s) => s.value === status)?.label ?? status
}

export function groupStatusLabel(status: string): string {
  return GROUP_STATUSES.find((s) => s.value === status)?.label ?? status
}

/** Truncate a filename to a maximum length, appending an ellipsis. */
export function truncateFilename(name: string | null, max = 50): string {
  if (!name) return ''
  return name.length > max ? `${name.slice(0, max)}...` : name
}

export interface SessionAttendee {
  /** Attendance row id (stable key; a TARBS user may have no cadre profile). */
  id: string
  cadre_profile_id: string | null
  person_code: string
  full_name: string
  level_code: string | null
  level_name: string | null
}

export interface GroupSession {
  id: string
  session_date: string | null
  material: string | null
  notes: string | null
  attendees: SessionAttendee[]
}

export interface PartyMemberInfo {
  member_number: string
  join_date: string | null
  status: string
  membership_source: string | null
}

export interface CadreInfo {
  level_code: string
  level_name: string
  status: string
  started_at: string | null
}

export interface AffiliationInfo {
  affiliation_type: string
  status: string
  start_date: string | null
  end_date: string | null
  notes: string | null
}

export interface MembershipProfile {
  person: { id: string; person_code: string; full_name: string }
  party_member: PartyMemberInfo | null
  cadre: CadreInfo | null
  affiliations: AffiliationInfo[]
}

/** Truncate long free text for a table cell. */
export function truncateText(value: string | null, max = 60): string {
  if (!value) return ''
  return value.length > max ? `${value.slice(0, max)}...` : value
}

// --- Ringkasan (read-only dashboard) ---

export interface SummaryPeriod {
  month: string
  from: string
  to: string
  days: number
  week_start: string
  week_end: string
  timezone: string
}

export interface LevelCount {
  level_id: string | null
  code: string
  name: string
  count: number
  percentage: number
}

export interface WeeklyAgendaRow {
  group_id: string
  name: string
  murabbi: string
  level_name: string | null
  last_session_date: string | null
  status: 'BERJALAN' | 'TIDAK_BERJALAN' | 'BARU'
}

export interface WeeklyAgenda {
  items: WeeklyAgendaRow[]
  meta: PageMeta
}

export interface TopMutabaahRow {
  rank: number
  cadre_profile_id: string | null
  full_name: string
  level_name: string
  group_name: string
  filled_days: number
  total_days: number
  percentage: number
}

export interface TopAttendanceRow {
  rank: number
  cadre_profile_id: string
  full_name: string
  level_name: string
  group_name: string
  approved: number
  total_meetings: number
  percentage: number
}

export interface SummaryPayload {
  period: SummaryPeriod
  groups_by_level?: LevelCount[]
  members_by_level?: LevelCount[]
  total_cadres?: number
  weekly_agenda?: WeeklyAgenda
  top_mutabaah?: TopMutabaahRow[]
  top_attendance?: TopAttendanceRow[]
}

export type SummarySection =
  | 'groups_by_level'
  | 'members_by_level'
  | 'total'
  | 'weekly_agenda'
  | 'top_mutabaah'
  | 'top_attendance'

export function weeklyAgendaStatusLabel(status: string): string {
  switch (status) {
    case 'BERJALAN':
      return 'Berjalan'
    case 'BARU':
      return 'Baru'
    default:
      return 'Tidak Berjalan'
  }
}

// --- Ringkasan grup (Kehadiran Temu Pekanan & Mutabaah Yaumiyah) ---

export interface SummaryDatePeriod {
  from: string
  to: string
  timezone: string
}

export interface AttendanceSessionRow {
  id: string
  session_date: string
  material: string
}

export interface AttendanceMemberRow {
  member_id: string
  cadre_profile_id: string
  full_name: string
  person_code: string
  joined_at: string
  attended: number
  total_meetings: number
  percentage: number
  attended_session_ids: string[]
}

export interface GroupAttendanceSummary {
  group_id: string
  period: SummaryDatePeriod
  sessions: AttendanceSessionRow[]
  members: AttendanceMemberRow[]
  summary: { average_percentage: number; meeting_count: number }
}

const MONTH_LABELS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export type AttendanceCellState = 'present' | 'absent' | 'not_applicable'

export interface AttendanceMonth {
  /** `yyyy-mm`, derived from `session_date`. */
  key: string
  /** Indonesian month and year, e.g. `Januari 2026`. */
  label: string
  sessions: AttendanceSessionRow[]
  meeting_count: number
  average_percentage: number
}

/**
 * Month bucket of a `yyyy-mm-dd` session date. The string is sliced rather
 * than parsed as a Date so the project timezone cannot shift an edge-of-month
 * meeting into the neighbouring month.
 */
export function attendanceMonthKey(sessionDate: string): string | null {
  const match = /^(\d{4})-(\d{2})/.exec(sessionDate)
  return match ? `${match[1]}-${match[2]}` : null
}

export function attendanceMonthLabel(key: string): string {
  const [, month] = key.split('-')
  const label = MONTH_LABELS[Number(month) - 1]
  return `${label ?? key} ${key.slice(0, 4)}`
}

/**
 * Cell state for one member × session pair, matching the metric rule: a
 * recorded attendance always counts as present, otherwise a session before
 * the join date is not applicable rather than absent.
 */
export function attendanceCellState(
  member: AttendanceMemberRow,
  session: AttendanceSessionRow,
): AttendanceCellState {
  if (member.attended_session_ids.includes(session.id)) return 'present'
  if (session.session_date < member.joined_at) return 'not_applicable'
  return 'absent'
}

/**
 * Group sessions into months, newest month first, dates chronologically
 * ascending within each month. Months without sessions are not returned.
 * Each month's average follows the existing per-member metric (only members
 * with at least one applicable meeting contribute).
 */
export function groupAttendanceByMonth(
  sessions: AttendanceSessionRow[],
  members: AttendanceMemberRow[],
): AttendanceMonth[] {
  const buckets = new Map<string, AttendanceSessionRow[]>()
  for (const session of sessions) {
    const key = attendanceMonthKey(session.session_date)
    if (!key) continue
    const bucket = buckets.get(key)
    if (bucket) bucket.push(session)
    else buckets.set(key, [session])
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([key, list]) => {
      const ordered = [...list].sort((a, b) =>
        a.session_date < b.session_date ? -1 : a.session_date > b.session_date ? 1 : a.id.localeCompare(b.id),
      )
      const percentages: number[] = []
      for (const member of members) {
        const applicable = ordered.filter(
          (session) =>
            member.attended_session_ids.includes(session.id) || session.session_date >= member.joined_at,
        )
        if (applicable.length === 0) continue
        const attended = applicable.filter((session) =>
          member.attended_session_ids.includes(session.id),
        ).length
        percentages.push(Math.round((attended / applicable.length) * 1000) / 10)
      }
      const average =
        percentages.length === 0
          ? 0
          : Math.round(
              (percentages.reduce((sum, value) => sum + value, 0) / percentages.length) * 10,
            ) / 10
      return {
        key,
        label: attendanceMonthLabel(key),
        sessions: ordered,
        meeting_count: ordered.length,
        average_percentage: average,
      }
    })
}

export interface MutabaahGroupItem {
  code: string
  label: string
  average_percentage: number
}

export interface MutabaahMemberItem {
  code: string
  label: string
  days_done: number
  percentage: number
}

export interface MutabaahMemberRow {
  member_id: string
  cadre_profile_id: string
  full_name: string
  person_code: string
  filled_days: number
  total_days: number
  percentage: number
  items: MutabaahMemberItem[]
}

export interface GroupMutabaahSummary {
  group_id: string
  period: SummaryDatePeriod
  days: number
  items: MutabaahGroupItem[]
  members: MutabaahMemberRow[]
}
