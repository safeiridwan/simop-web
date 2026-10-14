const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/

function two(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Format a date value for display as `dd-MM-yyyy`.
 *
 * Date-only strings (e.g. `2025-08-27` from an API date column) are sliced
 * verbatim so timezone conversion cannot shift the day. Full ISO timestamps
 * fall back to local date parts. Returns an em dash for empty/invalid input.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '—'
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '—'
    return `${two(value.getDate())}-${two(value.getMonth() + 1)}-${value.getFullYear()}`
  }
  const match = DATE_ONLY.exec(value)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return `${two(parsed.getDate())}-${two(parsed.getMonth() + 1)}-${parsed.getFullYear()}`
}
