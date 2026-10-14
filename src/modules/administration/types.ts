export type ReferenceKind = 'JENIS' | 'KODE_JENIS' | 'WILAYAH' | 'ORGANISASI'

export interface Reference {
  id: string
  kind: ReferenceKind
  code: string
  name: string | null
  retention_years: number | null
  is_active: boolean
}

export interface Token {
  type: 'variable' | 'text'
  value: string
}

export interface NumberTemplate {
  id: string
  name: string
  tokens: Token[]
  is_active: boolean
}

export interface Letter {
  id: string
  category: 'MASUK' | 'KELUAR'
  status: string
  jenis_id: string | null
  jenis_code: string | null
  jenis_name: string | null
  origin_number: string | null
  letter_number: string | null
  letter_date: string | null
  received_date: string | null
  sender: string | null
  recipient: string | null
  perihal: string
  summary: string | null
  sifat: string | null
  content_html: string | null
  content_file_id: string | null
  file_id: string | null
  lampiran: number
  generated_file_id: string | null
  distribution_status: string
  tracking_number: string | null
  email_link: string | null
  wa_link: string | null
  organization_unit_id: string | null
  created_by: string | null
  created_at: string
}

export interface Disposition {
  id: string
  letter_id: string
  from_user_id: string | null
  from_user_name: string | null
  to_user_id: string | null
  to_user_name: string | null
  instruction: string
  note: string | null
  status: string
  created_at: string
}

export interface Approval {
  stage: 'COORDINATION' | 'SIGNATURE'
  decision: string
  actor_id: string | null
  actor_name: string | null
  note: string | null
  decided_at: string | null
}

export interface LetterDetail {
  letter: Letter
  dispositions: Disposition[]
  approvals: Approval[]
}

export interface Notula {
  id: string
  organization_unit_id: string
  unit_name: string | null
  meeting_at: string
  file_id: string
  file_name: string | null
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export const LETTER_STATUSES: { value: string; label: string }[] = [
  { value: 'RECEIVED', label: 'Diterima' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'FORWARDED', label: 'Diteruskan' },
  { value: 'NONE', label: 'Tanpa Status' },
  { value: 'CREATED', label: 'Draf' },
  { value: 'REQUESTED', label: 'Diajukan' },
  { value: 'ON_PROGRESS', label: 'Proses Persetujuan' },
  { value: 'RELEASED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
]

export function letterStatusLabel(status: string): string {
  return LETTER_STATUSES.find((s) => s.value === status)?.label ?? status
}

export function categoryLabel(category: string): string {
  return category === 'MASUK' ? 'Masuk' : 'Keluar'
}

/** Agenda status colour: hijau = selesai, kuning = proses, merah = draf/ditolak. */
export function agendaColor(status: string): 'green' | 'yellow' | 'red' {
  if (status === 'RELEASED' || status === 'FORWARDED') return 'green'
  if (status === 'ON_PROGRESS' || status === 'PENDING' || status === 'REQUESTED' || status === 'RECEIVED') return 'yellow'
  return 'red'
}

export function agendaColorClass(status: string): string {
  switch (agendaColor(status)) {
    case 'green':
      return 'bg-green-100 text-green-800'
    case 'yellow':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-red-100 text-red-800'
  }
}

export const SIFAT_OPTIONS = ['Biasa', 'Penting', 'Rahasia', 'Sangat Segera']

export const DISPOSITION_INSTRUCTIONS: { value: string; label: string }[] = [
  { value: 'TINDAKLANJUTI', label: 'Tindaklanjuti' },
  { value: 'HADIR', label: 'Hadir mewakili' },
  { value: 'ARSIPKAN', label: 'Arsipkan' },
  { value: 'LAINNYA', label: 'Lainnya' },
]

export const DISTRIBUTION_STATUSES: { value: string; label: string }[] = [
  { value: 'TERKIRIM', label: 'Terkirim' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'BATAL', label: 'Batal' },
]

export const TEMPLATE_VARIABLES = ['Nomor', 'Kode', 'Bulan', 'Tahun']

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

export function romanMonth(month: number): string {
  return ROMAN[month] ?? ''
}

/** Live preview of a number template using a sample sequence and date. */
export function renderTemplatePreview(tokens: Token[], date = new Date(), seq = 1): string {
  const data: Record<string, string> = {
    Nomor: String(seq).padStart(3, '0'),
    Kode: 'SK',
    Bulan: romanMonth(date.getMonth() + 1),
    Tahun: String(date.getFullYear()),
  }
  return tokens.map((t) => (t.type === 'variable' ? data[t.value] ?? '' : t.value)).join('')
}

/** Truncate a filename to a maximum length, appending an ellipsis. */
export function truncateFilename(name: string | null, max = 50): string {
  if (!name) return ''
  return name.length > max ? `${name.slice(0, max)}...` : name
}
