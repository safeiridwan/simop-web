import type { RouteRecordRaw } from 'vue-router'

export const nonPartyRoutes: RouteRecordRaw[] = [
  {
    path: 'non-party',
    name: 'non-party',
    redirect: '/non-party/sympathizers',
  },
  {
    path: 'non-party/:type',
    name: 'non-party-type',
    component: () => import('./pages/NonPartyPage.vue'),
    meta: { requiresAuth: true, permission: 'members:read' },
  },
]
