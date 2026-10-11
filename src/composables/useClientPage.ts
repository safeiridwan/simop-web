import { computed, ref, type Ref } from 'vue'

/** Client-side pagination over an in-memory list. */
export function useClientPage<T>(items: Ref<T[]>, initialPageSize = 10) {
  const page = ref(1)
  const pageSize = ref(initialPageSize)

  const total = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const paged = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return items.value.slice(start, start + pageSize.value)
  })
  const meta = computed(() => ({ page: page.value, page_size: pageSize.value, total: total.value }))

  function setPage(target: number) {
    page.value = Math.min(Math.max(1, target), totalPages.value)
  }

  function setPageSize(size: number) {
    pageSize.value = size
    page.value = 1
  }

  function reset() {
    page.value = 1
  }

  return { page, pageSize, paged, meta, setPage, setPageSize, reset }
}
