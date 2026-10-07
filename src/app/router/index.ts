import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/app/stores/auth'
import { authRoutes } from '@/modules/auth/routes'
import { dashboardRoutes } from '@/modules/dashboard/routes'
import { healthRoutes } from '@/modules/health/routes'
import { memberRoutes } from '@/modules/members/routes'
import { nonPartyRoutes } from '@/modules/non-party/routes'
import { peopleRoutes } from '@/modules/people/routes'
import { permissionRoutes } from '@/modules/permissions/routes'
import { roleRoutes } from '@/modules/roles/routes'
import { userRoutes } from '@/modules/users/routes'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },
    ...authRoutes,
    ...healthRoutes,
    {
      path: '/',
      component: () => import('@/app/layouts/DashboardLayout.vue'),
      children: [
        ...dashboardRoutes,
        ...peopleRoutes,
        ...memberRoutes,
        ...nonPartyRoutes,
        ...userRoutes,
        ...roleRoutes,
        ...permissionRoutes,
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.bootstrap()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.permission && !auth.can(to.meta.permission)) {
    return { name: 'dashboard' }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return true
})
