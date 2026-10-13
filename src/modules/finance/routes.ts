import type { RouteRecordRaw } from 'vue-router'

const read = { requiresAuth: true, permission: 'finance:read' }

export const financeRoutes: RouteRecordRaw[] = [
  { path: 'finance/accounts', name: 'finance-accounts', component: () => import('./pages/AccountsPage.vue'), meta: read },
  { path: 'finance/anggaran', name: 'finance-anggaran', component: () => import('./pages/AnggaranPage.vue'), meta: read },
  { path: 'finance/journals', name: 'finance-journals', component: () => import('./pages/JournalsPage.vue'), meta: read },
  {
    path: 'finance/journals/:id',
    name: 'finance-journal-detail',
    component: () => import('./pages/JournalDetailPage.vue'),
    meta: read,
  },
  {
    path: 'finance/reports',
    name: 'finance-reports',
    component: () => import('./pages/FinanceReportsPage.vue'),
    meta: { requiresAuth: true, permission: 'reports:read' },
  },
]
