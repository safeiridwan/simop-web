import { createRouter, createWebHistory } from 'vue-router'

import { authRoutes } from '@/modules/auth/routes'
import { healthRoutes } from '@/modules/health/routes'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    ...authRoutes,
    ...healthRoutes,
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})
