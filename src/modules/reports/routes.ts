import type { RouteRecordRaw } from 'vue-router'

export const reportRoutes: RouteRecordRaw[] = [
  {
    path: 'reports',
    name: 'reports',
    component: () => import('./pages/ReportsPage.vue'),
    meta: { requiresAuth: true, permission: 'reports:read' },
  },
]
