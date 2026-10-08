import type { RouteRecordRaw } from 'vue-router'

const read = { requiresAuth: true, permission: 'ethics:read' }

export const ethicsRoutes: RouteRecordRaw[] = [
  {
    path: 'ethics/cases',
    name: 'ethics-cases',
    component: () => import('./pages/EthicsPage.vue'),
    meta: read,
  },
  {
    path: 'ethics/cases/:id',
    name: 'ethics-case',
    component: () => import('./pages/EthicsCasePage.vue'),
    meta: read,
  },
]
