import { describe, expect, it } from 'vitest'

import {
  assetConditionLabel,
  assetStatusLabel,
  ASSET_STATUSES,
  canEditReturn,
  canEditTransaction,
  conditionSummary,
  conditionsTotal,
  returnVisible,
  transactionAssetsLabel,
  transactionStatusLabel,
  TRANSACTION_TRANSITIONS,
  type AssetTransaction,
} from './types'

function transaction(partial: Partial<AssetTransaction>): AssetTransaction {
  return {
    id: 't',
    transaction_code: 'TRX-AST-0001',
    borrower_name: 'Budi',
    borrower_nik: '3273010101010001',
    borrower_phone: '081234567890',
    borrower_address: null,
    borrow_date: null,
    return_estimate_date: null,
    status: 'DRAFT',
    actual_return_date: null,
    borrow_photo_file_id: null,
    return_photo_file_id: null,
    item_count: 1,
    created_at: '',
    ...partial,
  }
}

describe('asset type helpers', () => {
  it('labels statuses', () => {
    expect(assetStatusLabel('AVAILABLE')).toBe('Tersedia')
    expect(assetStatusLabel('DISPOSED')).toBe('Dihapus')
  })

  it('labels conditions and falls back for unknown values', () => {
    expect(assetConditionLabel('GOOD')).toBe('Baik')
    expect(assetConditionLabel('NOPE')).toBe('NOPE')
  })

  it('exposes the status set', () => {
    expect(ASSET_STATUSES.map((s) => s.value)).toEqual(['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'DISPOSED', 'LOST'])
  })

  it('labels transaction statuses and transitions', () => {
    expect(transactionStatusLabel('APPROVED')).toBe('Disetujui')
    expect(TRANSACTION_TRANSITIONS.DRAFT[0].action).toBe('submit')
    expect(TRANSACTION_TRANSITIONS.APPROVED[0].action).toBe('complete')
    expect(TRANSACTION_TRANSITIONS.COMPLETED).toBeUndefined()
  })

  it('gates borrow edit to Draft and return edit to Approved', () => {
    expect(canEditTransaction('DRAFT')).toBe(true)
    expect(canEditTransaction('APPROVED')).toBe(false)
    expect(canEditReturn('APPROVED')).toBe(true)
    expect(canEditReturn('DRAFT')).toBe(false)
    expect(returnVisible('DRAFT')).toBe(false)
    expect(returnVisible('APPROVED')).toBe(true)
    expect(returnVisible('COMPLETED')).toBe(true)
  })

  it('summarises condition breakdowns', () => {
    expect(conditionSummary({ GOOD: 5, DAMAGED: 1 })).toBe('5 Baik, 1 Rusak ringan')
    expect(conditionSummary({})).toBe('—')
    expect(conditionsTotal({ GOOD: 5, FAIR: 1 })).toBe(6)
  })

  it('labels multi-asset transactions with "+N lainnya"', () => {
    expect(transactionAssetsLabel(transaction({ first_category_code: 'KRS-001', first_category_name: 'Kursi', item_count: 1 }))).toBe('KRS-001 - Kursi')
    expect(transactionAssetsLabel(transaction({ first_category_code: 'KRS-001', first_category_name: 'Kursi', item_count: 3 }))).toBe('KRS-001 - Kursi +2 lainnya')
    expect(transactionAssetsLabel(transaction({}))).toBe('—')
  })
})
