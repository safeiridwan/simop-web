<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Option {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  options: Option[]
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const query = ref('')
const open = ref(false)

const selected = computed(() => props.options.find((o) => o.value === props.modelValue) ?? null)

watch(
  selected,
  (s) => {
    if (!open.value) query.value = s?.label ?? ''
  },
  { immediate: true },
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.label.toLowerCase().includes(q))
})

function onFocus() {
  open.value = true
  query.value = ''
}

function onInput(event: Event) {
  query.value = (event.target as HTMLInputElement).value
  open.value = true
}

function select(option: Option) {
  emit('update:modelValue', option.value)
  query.value = option.label
  open.value = false
}

function clear() {
  emit('update:modelValue', '')
  query.value = ''
  open.value = true
}

function onBlur() {
  open.value = false
  query.value = selected.value?.label ?? ''
}
</script>

<template>
  <div class="relative">
    <input
      :value="open ? query : selected?.label ?? ''"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
      @focus="onFocus"
      @input="onInput"
      @blur="onBlur"
    />
    <button
      v-if="selected"
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      aria-label="Kosongkan"
      @mousedown.prevent
      @click="clear"
    >
      ×
    </button>

    <ul
      v-if="open"
      class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-slate-200 bg-white shadow-lg"
    >
      <li v-for="option in filtered" :key="option.value">
        <button
          type="button"
          class="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
          @mousedown.prevent="select(option)"
        >
          {{ option.label }}
        </button>
      </li>
      <li v-if="filtered.length === 0" class="px-3 py-2 text-sm text-slate-500">Tidak ada hasil.</li>
    </ul>
  </div>
</template>
