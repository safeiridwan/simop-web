export interface SecurityEvent {
  id: string
  event_type: string
  user_id: string | null
  email: string | null
  ip_address: string | null
  user_agent: string | null
  details: unknown
  created_at: string
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export const EVENT_TYPES = [
  { value: '', label: 'Semua' },
  { value: 'LOGIN_SUCCESS', label: 'Login sukses' },
  { value: 'LOGIN_FAILURE', label: 'Login gagal' },
  { value: 'LOGIN_LOCKED', label: 'Akun terkunci' },
  { value: 'TOKEN_REUSE', label: 'Penyalahgunaan token' },
  { value: 'RATE_LIMITED', label: 'Dibatasi rate' },
]

export function eventTypeLabel(type: string): string {
  return EVENT_TYPES.find((e) => e.value === type)?.label ?? type
}
