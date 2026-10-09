import type { RouteRecordRaw } from 'vue-router'

export const securityRoutes: RouteRecordRaw[] = [
  {
    path: 'security/events',
    name: 'security-events',
    component: () => import('./pages/SecurityEventsPage.vue'),
    meta: { requiresAuth: true, permission: 'security:read' },
  },
]
