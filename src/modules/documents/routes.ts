import type { RouteRecordRaw } from 'vue-router'

const read = { requiresAuth: true, permission: 'documents:read' }

export const documentRoutes: RouteRecordRaw[] = [
  {
    path: 'documents',
    name: 'documents',
    component: () => import('./pages/DocumentsPage.vue'),
    meta: read,
  },
  {
    path: 'documents/:id',
    name: 'document-detail',
    component: () => import('./pages/DocumentDetailPage.vue'),
    meta: read,
  },
]
