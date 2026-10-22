<script setup lang="ts">
withDefaults(
  defineProps<{
    field: string
    label: string
    active: string | null
    direction: 'asc' | 'desc' | null
    align?: 'left' | 'right'
  }>(),
  { align: 'left' },
)
const emit = defineEmits<{ sort: [field: string] }>()
</script>

<template>
  <th
    class="py-2 pr-4"
    :class="align === 'right' ? 'text-right' : 'text-left'"
    :aria-sort="active === field ? (direction === 'desc' ? 'descending' : 'ascending') : 'none'"
  >
    <button
      type="button"
      class="inline-flex items-center gap-1 whitespace-nowrap hover:text-slate-800"
      @click="emit('sort', field)"
    >
      {{ label }}
      <span class="text-brand-600" aria-hidden="true">{{
        active === field ? (direction === 'desc' ? '▼' : '▲') : ''
      }}</span>
    </button>
  </th>
</template>
