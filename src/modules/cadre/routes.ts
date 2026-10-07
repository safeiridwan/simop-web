import type { RouteRecordRaw } from 'vue-router'

export const cadreRoutes: RouteRecordRaw[] = [
  {
    path: 'cadres',
    name: 'cadres',
    component: () => import('./pages/CadresPage.vue'),
    meta: { requiresAuth: true, permission: 'cadre:read' },
  },
  {
    path: 'cadres/:id',
    name: 'cadre-detail',
    component: () => import('./pages/CadreDetailPage.vue'),
    meta: { requiresAuth: true, permission: 'cadre:read' },
  },
  {
    path: 'cadre-training',
    name: 'cadre-trainings',
    component: () => import('./pages/TrainingsPage.vue'),
    meta: { requiresAuth: true, permission: 'cadre:read' },
  },
  {
    path: 'cadre-training/:id',
    name: 'cadre-training-detail',
    component: () => import('./pages/TrainingDetailPage.vue'),
    meta: { requiresAuth: true, permission: 'cadre:read' },
  },
]
