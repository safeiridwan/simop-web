<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    placeholder?: string
    debounce?: number
  }>(),
  { placeholder: 'Cari', debounce: 350 },
)
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const text = ref(props.modelValue)
let timer: number | undefined

watch(
  () => props.modelValue,
  (value) => {
    if (value !== text.value) text.value = value
  },
)

// Emit once typing settles; the caller resets to page 1 and reloads.
watch(text, (value) => {
  window.clearTimeout(timer)
  timer = window.setTimeout(() => emit('update:modelValue', value), props.debounce)
})

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <input
    v-model="text"
    type="text"
    :placeholder="placeholder"
    :aria-label="label"
    class="w-full rounded border border-slate-300 px-2 py-1 text-xs font-normal"
  />
</template>
