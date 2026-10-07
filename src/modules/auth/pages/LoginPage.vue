<script setup lang="ts"></script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50">
    <div class="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 class="text-2xl font-semibold text-slate-900">SIMOP</h1>
      <p class="mt-2 text-sm text-slate-600">
        Halaman login masih placeholder (Phase 0). Autentikasi diimplementasikan pada Phase 1.
      </p>
      <router-link
        to="/health"
        class="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline"
      >
        Lihat status API
      </router-link>
    </div>
  </main>
</template>
