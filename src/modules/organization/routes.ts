import type { RouteRecordRaw } from 'vue-router'

export const organizationRoutes: RouteRecordRaw[] = [
  {
    path: 'organization',
    name: 'organization',
    component: () => import('./pages/OrganizationPage.vue'),
    meta: { requiresAuth: true, permission: 'organization:read' },
  },
  {
    path: 'organization/units/:id',
    name: 'organization-unit',
    component: () => import('./pages/OrganizationUnitPage.vue'),
    meta: { requiresAuth: true, permission: 'organization:read' },
  },
]
