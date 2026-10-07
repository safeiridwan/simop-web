<script setup lang="ts">
import { onMounted } from 'vue'

import { useRoles } from '../composables/useRoles'

const { roles, loading, error, load } = useRoles()

onMounted(() => void load())
</script>

<template>
  <section>
    <h1 class="mb-6 text-xl font-semibold text-slate-900">Peran</h1>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="roles.length === 0" class="text-sm text-slate-500">Belum ada peran.</p>

    <table v-else class="w-full border-collapse text-sm">
      <thead>
        <tr class="border-b border-slate-200 text-left text-slate-500">
          <th class="py-2">Kode</th>
          <th class="py-2">Nama</th>
          <th class="py-2">Deskripsi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="role in roles" :key="role.id" class="border-b border-slate-100">
          <td class="py-2 font-mono text-xs text-slate-900">{{ role.code }}</td>
          <td class="py-2 text-slate-600">{{ role.name }}</td>
          <td class="py-2 text-slate-600">{{ role.description ?? '—' }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
