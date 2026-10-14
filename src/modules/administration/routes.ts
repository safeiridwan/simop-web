import type { RouteRecordRaw } from 'vue-router'

export const administrationRoutes: RouteRecordRaw[] = [
  {
    path: '/administration/letters',
    name: 'administration-letters',
    component: () => import('./pages/LettersPage.vue'),
    meta: { requiresAuth: true, permission: 'correspondence:read' },
  },
  {
    path: '/administration/letters/new',
    name: 'administration-letter-new',
    component: () => import('./pages/LetterFormPage.vue'),
    meta: { requiresAuth: true, permission: 'correspondence:create' },
  },
  {
    path: '/administration/letters/:id',
    name: 'administration-letter-detail',
    component: () => import('./pages/LetterDetailPage.vue'),
    meta: { requiresAuth: true, permission: 'correspondence:read' },
  },
  {
    path: '/administration/classifications',
    name: 'administration-classifications',
    component: () => import('./pages/ClassificationsPage.vue'),
    meta: { requiresAuth: true, permission: 'correspondence:read' },
  },
  {
    path: '/administration/agenda',
    name: 'administration-agenda',
    component: () => import('./pages/AgendaPage.vue'),
    meta: { requiresAuth: true, permission: 'correspondence:read' },
  },
  {
    path: '/administration/notulae',
    name: 'administration-notulae',
    component: () => import('./pages/NotulaePage.vue'),
    meta: { requiresAuth: true, permission: 'correspondence:read' },
  },
  {
    path: '/administration/notulae/:id',
    name: 'administration-notula-detail',
    component: () => import('./pages/NotulaDetailPage.vue'),
    meta: { requiresAuth: true, permission: 'correspondence:read' },
  },
]
