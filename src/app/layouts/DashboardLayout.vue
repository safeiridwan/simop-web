<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/app/stores/auth'
import { visibleGroups } from './navigation'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const groups = computed(() => visibleGroups(auth.can))

const mobileNavOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    mobileNavOpen.value = false
  },
)

async function onLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Backdrop (mobile only) -->
    <div
      v-if="mobileNavOpen"
      class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
      aria-hidden="true"
      @click="mobileNavOpen = false"
    />

    <!-- Sidebar: drawer on mobile, static on lg+ -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 max-w-[80vw] -translate-x-full overflow-y-auto border-r border-slate-200 bg-white p-4 transition-transform duration-200 lg:translate-x-0"
      :class="{ 'translate-x-0': mobileNavOpen }"
    >
      <div class="mb-6 flex items-center justify-between">
        <p class="text-lg font-semibold text-brand-600">SIMOP</p>
        <button
          type="button"
          class="rounded p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Tutup menu"
          @click="mobileNavOpen = false"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav class="space-y-4">
        <div>
          <router-link
            to="/dashboard"
            class="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            active-class="bg-brand-50 font-medium text-brand-700"
          >
            Dashboard
          </router-link>
          <router-link
            to="/notifications"
            class="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            active-class="bg-brand-50 font-medium text-brand-700"
          >
            Notifikasi
          </router-link>
        </div>

        <div v-for="group in groups" :key="group.label">
          <p class="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {{ group.label }}
          </p>
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            active-class="bg-brand-50 font-medium text-brand-700"
          >
            {{ item.label }}
          </router-link>
        </div>
      </nav>
    </aside>

    <!-- Content -->
    <div class="flex min-h-screen flex-col lg:pl-64">
      <header
        class="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6"
      >
        <div class="flex min-w-0 items-center gap-2">
          <button
            type="button"
            class="rounded p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Buka menu"
            @click="mobileNavOpen = true"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span class="truncate text-sm text-slate-600">{{ auth.user?.full_name }}</span>
        </div>
        <button type="button" class="shrink-0 text-sm text-brand-600 hover:underline" @click="onLogout">
          Keluar
        </button>
      </header>
      <main class="flex-1 p-4 sm:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
