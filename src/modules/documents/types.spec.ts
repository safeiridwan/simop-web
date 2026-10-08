import { describe, expect, it } from 'vitest'

import { formatBytes, DOCUMENT_STATUSES } from './types'

describe('document type helpers', () => {
  it('formats byte sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB')
  })

  it('exposes the document status set', () => {
    expect(DOCUMENT_STATUSES.map((s) => s.value)).toEqual(['DRAFT', 'ACTIVE', 'ARCHIVED'])
  })
})
