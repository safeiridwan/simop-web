export interface Meeting {
  id: string
  organization_unit_id: string
  title: string
  meeting_type: string | null
  start_at: string | null
  end_at: string | null
  location: string | null
  status: string
  created_at: string
}

export interface MeetingParticipant {
  id: string
  meeting_id: string
  person_id: string
  person_code: string
  full_name: string
  role: string | null
  attendance: string
}

export interface MeetingAgenda {
  id: string
  meeting_id: string
  order_no: number
  topic: string
  description: string | null
}

export interface MeetingMinutes {
  id: string
  meeting_id: string
  content: string
  file_id: string | null
  created_at: string
}

export interface MeetingDecision {
  id: string
  meeting_id: string
  decision_number: string | null
  decision_text: string
  created_at: string
}

export interface ActionItem {
  id: string
  decision_id: string | null
  assigned_to: string | null
  assignee_name: string | null
  description: string
  due_date: string | null
  status: string
  completed_at: string | null
}

export interface MeetingDetail {
  meeting: Meeting
  participants: MeetingParticipant[]
  agenda: MeetingAgenda[]
  minutes: MeetingMinutes[]
  decisions: MeetingDecision[]
  action_items: ActionItem[]
}

export interface Task {
  id: string
  organization_unit_id: string
  title: string
  description: string | null
  assigned_to: string | null
  assignee_name: string | null
  due_date: string | null
  priority: string
  status: string
  completed_at: string | null
  created_at: string
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export const MEETING_STATUSES = [
  { value: 'PLANNED', label: 'Direncanakan' },
  { value: 'ONGOING', label: 'Berlangsung' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

export const ATTENDANCE_STATUSES = [
  { value: 'INVITED', label: 'Diundang' },
  { value: 'PRESENT', label: 'Hadir' },
  { value: 'ABSENT', label: 'Tidak hadir' },
  { value: 'EXCUSED', label: 'Izin' },
]

export const ITEM_STATUSES = [
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'IN_PROGRESS', label: 'Berjalan' },
  { value: 'DONE', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

export const TASK_PRIORITIES = [
  { value: 'LOW', label: 'Rendah' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Tinggi' },
  { value: 'URGENT', label: 'Mendesak' },
]

export function meetingStatusLabel(status: string): string {
  return MEETING_STATUSES.find((s) => s.value === status)?.label ?? status
}

export function taskPriorityLabel(priority: string): string {
  return TASK_PRIORITIES.find((p) => p.value === priority)?.label ?? priority
}
