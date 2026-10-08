export interface Dataset {
  columns: string[]
  rows: (string | number | null)[][]
}

export const REPORT_KEYS = [
  { key: 'members', label: 'Anggota' },
  { key: 'cadres', label: 'Kader' },
  { key: 'organization', label: 'Struktur' },
  { key: 'programs', label: 'Program' },
  { key: 'activities', label: 'Kegiatan' },
  { key: 'finance', label: 'Keuangan' },
  { key: 'assets', label: 'Aset' },
  { key: 'audit', label: 'Audit' },
]
