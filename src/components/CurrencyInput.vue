<script setup lang="ts">
import { ref, watch } from 'vue'

import { formatCurrencyInput, parseCurrencyInput } from '@/utils/currency'

const props = defineProps<{
  modelValue: number | null
  id?: string
  disabled?: boolean
  placeholder?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const text = ref(formatCurrencyInput(props.modelValue))

watch(
  () => props.modelValue,
  (value) => {
    if (parseCurrencyInput(text.value) === value) return
    text.value = formatCurrencyInput(value)
  },
)

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const parsed = parseCurrencyInput(raw)
  if (parsed == null) {
    text.value = ''
    emit('update:modelValue', null)
    return
  }
  if (Number.isNaN(parsed)) {
    text.value = raw
    emit('update:modelValue', null)
    return
  }
  text.value = formatCurrencyInput(parsed)
  emit('update:modelValue', parsed)
}
</script>

<template>
  <input
    :id="id"
    :value="text"
    type="text"
    inputmode="numeric"
    :disabled="disabled"
    :placeholder="placeholder ?? '0'"
    class="w-full rounded border border-slate-300 px-3 py-2 text-right text-sm"
    @input="onInput"
  />
</template>
