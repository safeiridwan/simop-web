import type { RouteRecordRaw } from 'vue-router'

export const memberRoutes: RouteRecordRaw[] = [
  {
    path: 'members',
    name: 'members',
    component: () => import('./pages/MembersPage.vue'),
    meta: { requiresAuth: true, permission: 'members:read' },
  },
  {
    path: 'members/:id',
    name: 'member-detail',
    component: () => import('./pages/MemberDetailPage.vue'),
    meta: { requiresAuth: true, permission: 'members:read' },
  },
]
