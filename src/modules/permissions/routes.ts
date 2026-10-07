import type { RouteRecordRaw } from 'vue-router'

export const permissionRoutes: RouteRecordRaw[] = [
  {
    path: 'settings/permissions',
    name: 'permissions',
    component: () => import('./pages/PermissionsPage.vue'),
    meta: { requiresAuth: true, permission: 'permissions:read' },
  },
]
