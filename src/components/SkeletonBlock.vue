<script setup lang="ts">
withDefaults(defineProps<{ kind?: 'chart' | 'card' | 'table'; rows?: number }>(), {
  kind: 'table',
  rows: 3,
})
</script>

<template>
  <div class="animate-pulse" aria-hidden="true">
    <div v-if="kind === 'chart'" class="flex h-64 items-center justify-center">
      <div class="h-40 w-40 rounded-full border-[18px] border-slate-200" />
    </div>
    <div v-else-if="kind === 'card'" class="h-24 rounded bg-slate-100" />
    <div v-else class="space-y-2">
      <div class="h-4 w-full rounded bg-slate-100" />
      <div v-for="row in rows" :key="row" class="h-4 rounded bg-slate-100" :class="row % 2 === 0 ? 'w-3/4' : 'w-full'" />
    </div>
  </div>
</template>
