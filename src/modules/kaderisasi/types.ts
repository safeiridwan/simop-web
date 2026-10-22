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
  cadre_profile_id: string
  person_code: string
  full_name: string
  level_code: string
  level_name: string
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
