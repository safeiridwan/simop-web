import type { RouteRecordRaw } from 'vue-router'

const read = { requiresAuth: true, permission: 'finance:read' }

export const financeRoutes: RouteRecordRaw[] = [
  { path: 'finance/accounts', name: 'finance-accounts', component: () => import('./pages/AccountsPage.vue'), meta: read },
  { path: 'finance/funds', name: 'finance-funds', component: () => import('./pages/FundsPage.vue'), meta: read },
  { path: 'finance/budgets', name: 'finance-budgets', component: () => import('./pages/BudgetsPage.vue'), meta: read },
  { path: 'finance/journals', name: 'finance-journals', component: () => import('./pages/JournalsPage.vue'), meta: read },
  {
    path: 'finance/journals/:id',
    name: 'finance-journal-detail',
    component: () => import('./pages/JournalDetailPage.vue'),
    meta: read,
  },
  {
    path: 'finance/reimbursements',
    name: 'finance-reimbursements',
    component: () => import('./pages/ReimbursementsPage.vue'),
    meta: read,
  },
]
