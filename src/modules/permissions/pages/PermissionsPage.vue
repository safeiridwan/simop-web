<script setup lang="ts">
import { onMounted } from 'vue'

import { usePermissions } from '../composables/usePermissions'

const { permissions, loading, error, load } = usePermissions()

onMounted(() => void load())
</script>

<template>
  <section>
    <h1 class="mb-6 text-xl font-semibold text-slate-900">Izin</h1>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="permissions.length === 0" class="text-sm text-slate-500">Belum ada izin.</p>

    <ul v-else class="divide-y divide-slate-100 text-sm">
      <li v-for="permission in permissions" :key="permission.id" class="flex flex-col py-2 sm:flex-row">
        <span class="font-mono text-xs text-slate-900 sm:w-56">{{ permission.code }}</span>
        <span class="text-slate-600">{{ permission.description ?? '—' }}</span>
      </li>
    </ul>
  </section>
</template>
