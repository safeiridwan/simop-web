import type { RouteRecordRaw } from 'vue-router'

export const dataQualityRoutes: RouteRecordRaw[] = [
  {
    path: 'data-quality',
    name: 'data-quality',
    component: () => import('./pages/DataQualityPage.vue'),
    meta: { requiresAuth: true, permission: 'data-quality:read' },
  },
]
