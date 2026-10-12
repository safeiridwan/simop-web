import { describe, expect, it } from 'vitest'

import { useSort } from './useSort'

describe('useSort', () => {
  it('cycles a field asc -> desc -> default', () => {
    const { sort, direction, toggle } = useSort()

    toggle('full_name')
    expect(sort.value).toBe('full_name')
    expect(direction.value).toBe('asc')

    toggle('full_name')
    expect(sort.value).toBe('full_name')
    expect(direction.value).toBe('desc')

    toggle('full_name')
    expect(sort.value).toBeNull()
    expect(direction.value).toBeNull()
  })

  it('starts a new field at ascending', () => {
    const { sort, direction, toggle } = useSort()
    toggle('full_name')
    toggle('status')
    expect(sort.value).toBe('status')
    expect(direction.value).toBe('asc')
  })
})
