import { apiGet, apiGetPage, apiPatch, apiPost } from '@/services/http'
import type { Account, Budget, Fund, Journal, JournalDetail, PageMeta, Receipt, Reimbursement } from './types'

export interface JournalLineInput {
  account_id: string
  debit: number
  credit: number
  description?: string
}

export const financeApi = {
  listAccounts: (query: { type?: string; search?: string } = {}) => {
    const params = new URLSearchParams()
    if (query.type) params.set('account_type', query.type)
    if (query.search) params.set('search', query.search)
    const qs = params.toString()
    return apiGet<Account[]>(`/api/v1/finance/accounts${qs ? `?${qs}` : ''}`)
  },
  createAccount: (input: { code: string; name: string; account_type: string }) =>
    apiPost<Account>('/api/v1/finance/accounts', input),
  updateAccount: (id: string, input: { name: string; account_type: string; is_active: boolean }) =>
    apiPatch<Account>(`/api/v1/finance/accounts/${id}`, input),

  listFunds: () => apiGet<Fund[]>('/api/v1/finance/funds'),
  createFund: (input: { code: string; name: string; description?: string }) =>
    apiPost<Fund>('/api/v1/finance/funds', input),

  listBudgets: (query: { fiscalYear?: number; status?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 20) })
    if (query.fiscalYear) params.set('fiscal_year', String(query.fiscalYear))
    if (query.status) params.set('status', query.status)
    return apiGetPage<Budget[], PageMeta>(`/api/v1/finance/budgets?${params.toString()}`)
  },
  createBudget: (input: { organization_unit_id: string; account_id: string; fiscal_year: number; budget_amount: number; program_id?: string }) =>
    apiPost<Budget>('/api/v1/finance/budgets', input),
  transitionBudget: (id: string, action: string) => apiPost<Budget>(`/api/v1/finance/budgets/${id}/${action}`),

  listJournals: (query: { status?: string; search?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 20) })
    if (query.status) params.set('status', query.status)
    if (query.search) params.set('search', query.search)
    return apiGetPage<Journal[], PageMeta>(`/api/v1/finance/journals?${params.toString()}`)
  },
  getJournal: (id: string) => apiGet<JournalDetail>(`/api/v1/finance/journals/${id}`),
  createJournal: (input: {
    transaction_date: string
    description?: string
    organization_unit_id: string
    program_id?: string
    fund_id?: string
    file_id?: string
    lines: JournalLineInput[]
  }) => apiPost<Journal>('/api/v1/finance/journals', input),
  transitionJournal: (id: string, action: string) => apiPost<Journal>(`/api/v1/finance/journals/${id}/${action}`),

  listReimbursements: (query: { status?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 20) })
    if (query.status) params.set('status', query.status)
    return apiGetPage<Reimbursement[], PageMeta>(`/api/v1/finance/reimbursements?${params.toString()}`)
  },
  createReimbursement: (input: { organization_unit_id: string; requester_id: string; amount: number; reason?: string; program_id?: string }) =>
    apiPost<Reimbursement>('/api/v1/finance/reimbursements', input),
  transitionReimbursement: (id: string, action: string) =>
    apiPost<Reimbursement>(`/api/v1/finance/reimbursements/${id}/${action}`),

  listReceipts: (reimbursementId: string) => apiGet<Receipt[]>(`/api/v1/finance/receipts?reimbursement_id=${reimbursementId}`),
  listJournalReceipts: (journalId: string) => apiGet<Receipt[]>(`/api/v1/finance/receipts?journal_entry_id=${journalId}`),
  createReceipt: (input: { reimbursement_id?: string; journal_entry_id?: string; receipt_number: string; receipt_date?: string }) =>
    apiPost<Receipt>('/api/v1/finance/receipts', input),
  verifyReceipt: (id: string) => apiPost<Receipt>(`/api/v1/finance/receipts/${id}/verify`),
}
