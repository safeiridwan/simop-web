import type { RouteRecordRaw } from 'vue-router'

const read = { requiresAuth: true, permission: 'governance:read' }

export const governanceRoutes: RouteRecordRaw[] = [
  {
    path: 'meetings',
    name: 'meetings',
    component: () => import('./pages/MeetingsPage.vue'),
    meta: read,
  },
  {
    path: 'meetings/:id',
    name: 'meeting-detail',
    component: () => import('./pages/MeetingDetailPage.vue'),
    meta: read,
  },
  {
    path: 'tasks',
    name: 'tasks',
    component: () => import('./pages/TasksPage.vue'),
    meta: read,
  },
]
