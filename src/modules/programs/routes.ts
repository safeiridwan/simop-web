import type { RouteRecordRaw } from 'vue-router'

export const programRoutes: RouteRecordRaw[] = [
  {
    path: 'programs',
    name: 'programs',
    component: () => import('./pages/ProgramsPage.vue'),
    meta: { requiresAuth: true, permission: 'programs:read' },
  },
  {
    path: 'programs/:id',
    name: 'program-detail',
    component: () => import('./pages/ProgramDetailPage.vue'),
    meta: { requiresAuth: true, permission: 'programs:read' },
  },
  {
    path: 'activities',
    name: 'activities',
    component: () => import('./pages/ActivitiesPage.vue'),
    meta: { requiresAuth: true, permission: 'programs:read' },
  },
]
