<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  to?: string
}

withDefaults(defineProps<{ items: BreadcrumbItem[]; class?: string }>(), { class: 'mb-1' })
</script>

<template>
  <nav :class="$props.class" aria-label="Breadcrumb">
    <ol class="flex flex-wrap items-center gap-1 text-xs text-slate-500">
      <li v-for="(item, index) in items" :key="`${item.label}-${index}`" class="flex items-center gap-1">
        <router-link v-if="item.to && index < items.length - 1" :to="item.to" class="hover:underline">
          {{ item.label }}
        </router-link>
        <span v-else aria-current="page" :class="index === items.length - 1 ? 'text-slate-700' : ''">
          {{ item.label }}
        </span>
        <span v-if="index < items.length - 1" aria-hidden="true">/</span>
      </li>
    </ol>
  </nav>
</template>
