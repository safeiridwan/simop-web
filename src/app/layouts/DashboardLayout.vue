<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/app/stores/auth'

const auth = useAuthStore()
const router = useRouter()

interface NavItem {
  label: string
  to: string
  permission?: string
}

const nav: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Orang', to: '/people', permission: 'persons:read' },
  { label: 'Pengguna', to: '/settings/users', permission: 'users:read' },
  { label: 'Peran', to: '/settings/roles', permission: 'roles:read' },
  { label: 'Izin', to: '/settings/permissions', permission: 'permissions:read' },
]

async function onLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-screen bg-slate-50">
    <aside class="w-56 border-r border-slate-200 bg-white p-4">
      <p class="mb-6 text-lg font-semibold text-brand-600">SIMOP</p>
      <nav class="space-y-1">
        <template v-for="item in nav" :key="item.to">
          <router-link
            v-if="!item.permission || auth.can(item.permission)"
            :to="item.to"
            class="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            active-class="bg-brand-50 font-medium text-brand-700"
          >
            {{ item.label }}
          </router-link>
        </template>
      </nav>
    </aside>

    <div class="flex-1">
      <header class="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <span class="text-sm text-slate-600">{{ auth.user?.full_name }}</span>
        <button type="button" class="text-sm text-brand-600 hover:underline" @click="onLogout">Keluar</button>
      </header>
      <main class="p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
