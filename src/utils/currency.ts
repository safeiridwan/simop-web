/** Format a nominal as Indonesian Rupiah, empty values show a dash. */
export function formatRupiah(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '-'
  return `Rp ${value.toLocaleString('id-ID')}`
}

/**
 * Parse a masked currency input ("2.000.000" or "2.000.000,50") back to a
 * number. Dots are thousands separators; a comma is the decimal separator.
 * Returns null for blank input and NaN for input that is not a number.
 */
export function parseCurrencyInput(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const normalized = trimmed.replace(/[Rp\s]/g, '').replace(/\./g, '').replace(',', '.')
  if (normalized === '' || !/^-?\d*(\.\d*)?$/.test(normalized)) return Number.NaN
  return Number(normalized)
}

/** Format a number for a masked currency input (no "Rp" prefix). */
export function formatCurrencyInput(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return ''
  const [whole, fraction] = String(value).split('.')
  const grouped = Number(whole).toLocaleString('id-ID')
  return fraction ? `${grouped},${fraction}` : grouped
}
