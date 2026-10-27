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
