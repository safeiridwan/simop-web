export interface Notification {
  id: string
  user_id: string
  title: string
  body: string | null
  category: string | null
  channel: string
  status: string
  link: string | null
  read_at: string | null
  created_at: string
}

export interface Preference {
  id: string
  category: string
  channel: string
  enabled: boolean
  updated_at: string
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export const CHANNELS = [
  { value: 'IN_APP', label: 'Dalam Aplikasi' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'PUSH', label: 'Push' },
]

export const NOTIFICATION_CATEGORIES = [
  { value: 'GENERAL', label: 'Umum' },
  { value: 'TASK', label: 'Tugas' },
  { value: 'PROGRAM', label: 'Program' },
  { value: 'FINANCE', label: 'Keuangan' },
  { value: 'MEMBERSHIP', label: 'Keanggotaan' },
]

export function channelLabel(channel: string): string {
  return CHANNELS.find((c) => c.value === channel)?.label ?? channel
}
