import type { RouteRecordRaw } from 'vue-router'

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: 'settings/scopes',
    name: 'settings-scopes',
    component: () => import('./pages/ScopesPage.vue'),
    meta: { requiresAuth: true, permission: 'users:read' },
  },
  {
    path: 'settings/system',
    name: 'settings-system',
    component: () => import('./pages/SystemSettingsPage.vue'),
    meta: { requiresAuth: true, permission: 'settings:read' },
  },
]
