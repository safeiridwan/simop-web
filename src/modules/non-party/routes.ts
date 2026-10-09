import type { RouteRecordRaw } from 'vue-router'

export const nonPartyRoutes: RouteRecordRaw[] = [
  {
    path: 'non-party',
    name: 'non-party',
    component: () => import('./pages/NonPartyPage.vue'),
    meta: { requiresAuth: true, permission: 'members:read' },
  },
  {
    path: 'non-party/:type',
    redirect: '/non-party',
  },
]
