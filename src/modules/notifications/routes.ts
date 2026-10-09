import type { RouteRecordRaw } from 'vue-router'

export const notificationRoutes: RouteRecordRaw[] = [
  {
    path: 'notifications',
    name: 'notifications',
    component: () => import('./pages/NotificationsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'notification-preferences',
    name: 'notification-preferences',
    component: () => import('./pages/PreferencesPage.vue'),
    meta: { requiresAuth: true },
  },
]
