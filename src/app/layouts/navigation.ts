/**
 * Sidebar navigation. Kept separate from the layout so the visible groups can
 * be unit-tested without mounting the whole shell.
 *
 * Groups that are intentionally not shown (see ADR-029):
 *   - Administrasi (correspondence)
 *   - Etik (ethics)
 *   - Laporan & Data (reports, data quality, election readiness)
 *
 * Their routes stay registered on purpose: they can still be opened directly
 * by users who hold the permission. "Laporan Keuangan" lives under Keuangan and
 * remains visible.
 */

export interface NavItem {
  label: string
  to: string
  permission?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

// Grouped navigation (plan §43). Groups with no visible item are hidden.
export const navGroups: NavGroup[] = [
  {
    label: 'Keanggotaan',
    items: [
      { label: 'Semua Orang', to: '/people', permission: 'persons:read' },
      { label: 'Anggota Partai', to: '/members', permission: 'members:read' },
      { label: 'Kader', to: '/cadres', permission: 'cadre:read' },
      { label: 'Non-Kader', to: '/non-party', permission: 'members:read' },
    ],
  },
  {
    label: 'Kaderisasi',
    items: [
      { label: 'Ringkasan', to: '/kaderisasi/ringkasan', permission: 'kaderisasi:read' },
      { label: 'Taklimat', to: '/kaderisasi/taklimat', permission: 'kaderisasi:read' },
      { label: 'Grup Pembinaan', to: '/kaderisasi/grup-pembinaan', permission: 'kaderisasi:read' },
    ],
  },
  {
    label: 'Organisasi',
    items: [{ label: 'Struktur', to: '/organization', permission: 'organization:read' }],
  },
  {
    label: 'Program',
    items: [
      { label: 'Ringkasan', to: '/programs/summary', permission: 'programs:read' },
      { label: 'Semua Program', to: '/programs', permission: 'programs:read' },
    ],
  },
  {
    label: 'Keuangan',
    items: [
      { label: 'Jurnal', to: '/finance/journals', permission: 'finance:read' },
      { label: 'Akun', to: '/finance/accounts', permission: 'finance:read' },
      { label: 'Anggaran', to: '/finance/anggaran', permission: 'finance:read' },
      { label: 'Laporan Keuangan', to: '/finance/reports', permission: 'reports:read' },
    ],
  },
  {
    label: 'Aset',
    items: [
      { label: 'Daftar Aset', to: '/assets', permission: 'assets:read' },
      { label: 'Transaksi Aset', to: '/assets/transactions', permission: 'assets:read' },
      { label: 'Pengaturan Aset', to: '/assets/categories', permission: 'assets:read' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { label: 'Pengguna', to: '/settings/users', permission: 'users:read' },
      { label: 'Peran', to: '/settings/roles', permission: 'roles:read' },
      { label: 'Izin', to: '/settings/permissions', permission: 'permissions:read' },
      { label: 'Organization Scope', to: '/settings/scopes', permission: 'users:read' },
      { label: 'Pengaturan Sistem', to: '/settings/system', permission: 'settings:read' },
      { label: 'Keamanan', to: '/security/events', permission: 'security:read' },
    ],
  },
]

/** Drops groups whose items are all invisible for this user. */
export function visibleGroups(can: (code: string) => boolean): NavGroup[] {
  return navGroups
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) => !item.permission || can(item.permission)),
    }))
    .filter((group) => group.items.length > 0)
}
