import type { RouteRecordRaw } from 'vue-router'

export const kaderisasiRoutes: RouteRecordRaw[] = [
  {
    path: '/kaderisasi/ringkasan',
    name: 'kaderisasi-ringkasan',
    component: () => import('./pages/SummaryPage.vue'),
    meta: { requiresAuth: true, permission: 'kaderisasi:read' },
  },
  {
    path: '/kaderisasi/taklimat',
    name: 'kaderisasi-taklimat',
    component: () => import('./pages/TaklimatPage.vue'),
    meta: { requiresAuth: true, permission: 'kaderisasi:read' },
  },
  {
    path: '/kaderisasi/taklimat/new',
    name: 'kaderisasi-taklimat-new',
    component: () => import('./pages/TaklimatFormPage.vue'),
    meta: { requiresAuth: true, permission: 'kaderisasi:create' },
  },
  {
    path: '/kaderisasi/taklimat/:id',
    name: 'kaderisasi-taklimat-detail',
    component: () => import('./pages/TaklimatDetailPage.vue'),
    meta: { requiresAuth: true, permission: 'kaderisasi:read' },
  },
  {
    path: '/kaderisasi/grup-pembinaan',
    name: 'kaderisasi-groups',
    component: () => import('./pages/GroupsPage.vue'),
    meta: { requiresAuth: true, permission: 'kaderisasi:read' },
  },
  {
    path: '/kaderisasi/grup-pembinaan/new',
    name: 'kaderisasi-group-new',
    component: () => import('./pages/GroupFormPage.vue'),
    meta: { requiresAuth: true, permission: 'kaderisasi:create' },
  },
  {
    path: '/kaderisasi/grup-pembinaan/:id',
    name: 'kaderisasi-group-detail',
    component: () => import('./pages/GroupDetailPage.vue'),
    meta: { requiresAuth: true, permission: 'kaderisasi:read' },
  },
  {
    path: '/kaderisasi/grup-pembinaan/:id/riwayat',
    name: 'kaderisasi-group-history',
    component: () => import('./pages/GroupHistoryPage.vue'),
    meta: { requiresAuth: true, permission: 'kaderisasi:read' },
  },
]
