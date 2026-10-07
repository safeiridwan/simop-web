import type { RouteRecordRaw } from 'vue-router'

export const peopleRoutes: RouteRecordRaw[] = [
  {
    path: 'people',
    name: 'people',
    component: () => import('./pages/PeoplePage.vue'),
    meta: { requiresAuth: true, permission: 'persons:read' },
  },
  {
    path: 'people/new',
    name: 'person-create',
    component: () => import('./pages/PersonCreatePage.vue'),
    meta: { requiresAuth: true, permission: 'persons:create' },
  },
  {
    path: 'people/:id',
    name: 'person-detail',
    component: () => import('./pages/PersonDetailPage.vue'),
    meta: { requiresAuth: true, permission: 'persons:read' },
  },
  {
    path: 'people/:id/edit',
    name: 'person-edit',
    component: () => import('./pages/PersonEditPage.vue'),
    meta: { requiresAuth: true, permission: 'persons:update' },
  },
]
