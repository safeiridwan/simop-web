import { describe, expect, it } from 'vitest'

import { navGroups, visibleGroups } from './navigation'

const ALL_PERMISSIONS = new Set(
  navGroups.flatMap((group) => group.items.map((item) => item.permission)),
)

// ADMIN from ADR-029: every permission except the Sistem group.
const SYSTEM_PERMISSIONS = new Set([
  'users:read',
  'users:create',
  'users:update',
  'roles:read',
  'permissions:read',
  'settings:read',
  'settings:update',
  'security:read',
])

function adminCan(code: string): boolean {
  return ALL_PERMISSIONS.has(code) && !SYSTEM_PERMISSIONS.has(code)
}

describe('sidebar navigation', () => {
  it('never exposes the hidden groups, even with every permission', () => {
    const labels = visibleGroups(() => true).map((group) => group.label)

    // Hidden per ADR-029 (not merely filtered by permission).
    for (const hidden of ['Administrasi', 'Etik', 'Laporan & Data']) {
      expect(labels).not.toContain(hidden)
    }
    expect(labels).toEqual([
      'Keanggotaan',
      'Kaderisasi',
      'Organisasi',
      'Program',
      'Keuangan',
      'Aset',
      'Sistem',
    ])
  })

  it('does not define routes for the hidden modules anywhere in the sidebar', () => {
    const paths = navGroups.flatMap((group) => group.items.map((item) => item.to))

    expect(paths.filter((path) => path.startsWith('/administration'))).toEqual([])
    expect(paths.filter((path) => path.startsWith('/ethics'))).toEqual([])
    expect(paths.filter((path) => path.startsWith('/reports'))).toEqual([])
    expect(paths.filter((path) => path.startsWith('/data-quality'))).toEqual([])
    expect(paths.filter((path) => path.startsWith('/election-readiness'))).toEqual([])
  })

  it('keeps Laporan Keuangan under Keuangan', () => {
    const finance = navGroups.find((group) => group.label === 'Keuangan')

    expect(finance?.items.map((item) => item.to)).toContain('/finance/reports')
  })

  it('hides the Sistem group for an ADMIN identity', () => {
    const labels = visibleGroups(adminCan).map((group) => group.label)

    expect(labels).not.toContain('Sistem')
    expect(labels).toContain('Keuangan')
    expect(labels).toContain('Keanggotaan')
  })

  it('shows the Sistem group for a SUPER_ADMIN identity', () => {
    const labels = visibleGroups(() => true).map((group) => group.label)

    expect(labels).toContain('Sistem')
  })

  it('drops a group when the user has none of its permissions', () => {
    expect(visibleGroups(() => false)).toEqual([])
  })
})
