import type { RouteRecordRaw } from 'vue-router'

export const electionReadinessRoutes: RouteRecordRaw[] = [
  {
    path: 'election-readiness',
    name: 'election-readiness',
    component: () => import('./pages/ElectionReadinessPage.vue'),
    meta: { requiresAuth: true, permission: 'election-readiness:read' },
  },
]
