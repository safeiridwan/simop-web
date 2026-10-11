import { ref } from 'vue'
import { describe, expect, it } from 'vitest'

import { useClientPage } from './useClientPage'

describe('useClientPage', () => {
  it('slices items by page and clamps the page', () => {
    const items = ref(Array.from({ length: 45 }, (_, i) => i))
    const { paged, meta, page, setPage } = useClientPage(items, 20)

    expect(paged.value).toHaveLength(20)
    expect(meta.value).toEqual({ page: 1, page_size: 20, total: 45 })

    setPage(3)
    expect(paged.value).toHaveLength(5)

    setPage(99)
    expect(page.value).toBe(3)
  })

  it('resets to the first page', () => {
    const items = ref([1, 2, 3])
    const { page, setPage, reset } = useClientPage(items, 2)
    setPage(2)
    reset()
    expect(page.value).toBe(1)
  })

  it('changes the page size and resets to page 1', () => {
    const items = ref(Array.from({ length: 45 }, (_, i) => i))
    const { page, pageSize, paged, setPage, setPageSize } = useClientPage(items, 20)
    setPage(3)
    setPageSize(10)
    expect(pageSize.value).toBe(10)
    expect(page.value).toBe(1)
    expect(paged.value).toHaveLength(10)
  })
})
