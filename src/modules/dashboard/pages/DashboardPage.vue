<script setup lang="ts">
import { useAuthStore } from '@/app/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <section>
    <h1 class="mb-4 text-xl font-semibold text-slate-900">Dashboard</h1>
    <p class="text-sm text-slate-600">Selamat datang, {{ auth.user?.full_name }}.</p>
  </section>
</template>
