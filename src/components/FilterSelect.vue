<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    label: string
    options: { value: string; label: string }[]
    allLabel?: string
  }>(),
  { allLabel: 'Semua' },
)
const emit = defineEmits<{ 'update:modelValue': [value: string]; change: [] }>()
</script>

<template>
  <select
    :value="modelValue"
    class="w-full rounded border border-slate-300 px-2 py-1 text-xs font-normal"
    :aria-label="label"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value); emit('change')"
  >
    <option value="">{{ allLabel }}</option>
    <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
  </select>
</template>
