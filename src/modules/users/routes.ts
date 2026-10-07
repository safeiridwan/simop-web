import type { RouteRecordRaw } from 'vue-router'

export const userRoutes: RouteRecordRaw[] = [
  {
    path: 'settings/users',
    name: 'users',
    component: () => import('./pages/UsersPage.vue'),
    meta: { requiresAuth: true, permission: 'users:read' },
  },
]
