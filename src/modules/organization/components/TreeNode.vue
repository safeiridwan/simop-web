<script setup lang="ts">
import type { UnitNode } from '../types'

defineProps<{ nodes: UnitNode[] }>()
</script>

<template>
  <ul class="space-y-1">
    <li v-for="node in nodes" :key="node.id">
      <div class="flex flex-wrap items-center gap-2">
        <router-link :to="`/organization/units/${node.id}`" class="text-sm text-brand-600 hover:underline">
          {{ node.name }}
        </router-link>
        <span class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">{{ node.unit_type_code }}</span>
      </div>
      <div v-if="node.children.length" class="mt-1 border-l border-slate-200 pl-4">
        <TreeNode :nodes="node.children" />
      </div>
    </li>
  </ul>
</template>
