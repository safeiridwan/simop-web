import { computed, ref, type Ref } from 'vue'

/** Client-side pagination over an in-memory list. */
export function useClientPage<T>(items: Ref<T[]>, pageSize = 20) {
  const page = ref(1)

  const total = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
  const paged = computed(() => {
    const start = (page.value - 1) * pageSize
    return items.value.slice(start, start + pageSize)
  })
  const meta = computed(() => ({ page: page.value, page_size: pageSize, total: total.value }))

  function setPage(target: number) {
    page.value = Math.min(Math.max(1, target), totalPages.value)
  }

  function reset() {
    page.value = 1
  }

  return { page, paged, meta, setPage, reset }
}
