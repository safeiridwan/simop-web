import type { RouteRecordRaw } from 'vue-router'

export const roleRoutes: RouteRecordRaw[] = [
  {
    path: 'settings/roles',
    name: 'roles',
    component: () => import('./pages/RolesPage.vue'),
    meta: { requiresAuth: true, permission: 'roles:read' },
  },
]
