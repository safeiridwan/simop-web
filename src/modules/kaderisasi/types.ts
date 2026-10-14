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
  level_id: string | null
  level_code: string | null
  level_name: string | null
  status: string
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
