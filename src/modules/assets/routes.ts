import type { RouteRecordRaw } from 'vue-router'

const read = { requiresAuth: true, permission: 'assets:read' }

export const assetRoutes: RouteRecordRaw[] = [
  {
    path: 'assets',
    name: 'assets',
    component: () => import('./pages/AssetsPage.vue'),
    meta: read,
  },
  {
    path: 'assets/categories',
    name: 'asset-categories',
    component: () => import('./pages/CategoriesPage.vue'),
    meta: read,
  },
  {
    path: 'assets/:id',
    name: 'asset-detail',
    component: () => import('./pages/AssetDetailPage.vue'),
    meta: read,
  },
]
