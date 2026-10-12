import { ref } from 'vue'

export type SortDirection = 'asc' | 'desc'

/**
 * Header-click sort state. Each click cycles a field through
 * asc → desc → default (no sort). Callers reload after toggling.
 */
export function useSort() {
  const sort = ref<string | null>(null)
  const direction = ref<SortDirection | null>(null)

  function toggle(field: string): void {
    if (sort.value !== field) {
      sort.value = field
      direction.value = 'asc'
    } else if (direction.value === 'asc') {
      direction.value = 'desc'
    } else {
      sort.value = null
      direction.value = null
    }
  }

  return { sort, direction, toggle }
}
