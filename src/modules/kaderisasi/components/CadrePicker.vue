<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { kaderisasiApi, type CadreOption } from '../api'

const props = withDefaults(
  defineProps<{
    modelValue: string
    initialLabel?: string
    groupId?: string
    excludeIds?: string[]
    placeholder?: string
    disabled?: boolean
    clearOnSelect?: boolean
  }>(),
  {
    initialLabel: '',
    groupId: '',
    excludeIds: () => [],
    placeholder: 'Cari nama atau nomor anggota',
    disabled: false,
    clearOnSelect: false,
  },
)
const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [option: CadreOption]
}>()

const query = ref('')
const results = ref<CadreOption[]>([])
const open = ref(false)
const loading = ref(false)
const active = ref(-1)
const label = ref(props.initialLabel)
let timer: number | undefined

const listOpen = computed(() => open.value)

watch(
  () => props.modelValue,
  (id) => {
    if (!id) {
      label.value = ''
      query.value = ''
      return
    }
    query.value = label.value || props.initialLabel
  },
  { immediate: true },
)

watch(
  () => props.excludeIds,
  () => {
    if (open.value) void search(query.value)
  },
  { deep: true },
)

function optionLabel(option: CadreOption): string {
  return `${option.person_code} - ${option.full_name}`
}

async function search(term: string) {
  const q = term.trim()
  if (q.length < 2) {
    results.value = []
    open.value = true
    active.value = -1
    return
  }
  loading.value = true
  try {
    results.value = await kaderisasiApi.cadreOptions({
      search: q,
      groupId: props.groupId || undefined,
      exclude: props.excludeIds,
      limit: 10,
    })
    open.value = true
    active.value = results.value.length ? 0 : -1
  } catch {
    results.value = []
    open.value = true
  } finally {
    loading.value = false
  }
}

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  label.value = value
  query.value = value
  open.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => void search(value), 300)
}

function choose(option: CadreOption) {
  label.value = optionLabel(option)
  emit('update:modelValue', option.id)
  emit('select', option)
  results.value = []
  open.value = false
  active.value = -1
  if (props.clearOnSelect) {
    label.value = ''
    query.value = ''
    emit('update:modelValue', '')
  }
}

function clear() {
  label.value = ''
  query.value = ''
  results.value = []
  emit('update:modelValue', '')
}

function move(delta: number) {
  if (!results.value.length) return
  open.value = true
  const next = active.value + delta
  active.value = (next + results.value.length) % results.value.length
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Enter') {
    if (open.value && active.value >= 0 && results.value[active.value]) {
      event.preventDefault()
      choose(results.value[active.value])
    }
  } else if (event.key === 'Escape') {
    open.value = false
  }
}

function onBlur() {
  window.setTimeout(() => {
    open.value = false
  }, 120)
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <div class="relative">
    <div class="flex gap-2">
      <input
        :value="label"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="listOpen"
        :aria-activedescendant="active >= 0 && results[active] ? `cadre-option-${results[active].id}` : undefined"
        :placeholder="placeholder"
        :disabled="disabled"
        class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        @input="onInput"
        @keydown="onKeydown"
        @focus="open = true"
        @blur="onBlur"
      />
      <button
        v-if="modelValue"
        type="button"
        :disabled="disabled"
        class="shrink-0 rounded border border-slate-300 px-3 py-2 text-sm"
        @click="clear"
      >
        Hapus
      </button>
    </div>

    <ul
      v-if="open"
      role="listbox"
      class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded border border-slate-200 bg-white shadow-lg"
    >
      <li v-if="loading" class="px-3 py-2 text-sm text-slate-500">Memuat...</li>
      <template v-else-if="results.length">
        <li v-for="(option, index) in results" :id="`cadre-option-${option.id}`" :key="option.id" role="option" :aria-selected="index === active">
          <button
            type="button"
            class="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            :class="index === active ? 'bg-slate-50' : ''"
            @mousedown.prevent="choose(option)"
          >
            {{ option.person_code }} - {{ option.full_name }}
            <span class="text-xs text-slate-500">({{ option.level_name }})</span>
          </button>
        </li>
      </template>
      <li v-else class="px-3 py-2 text-sm text-slate-500">
        {{ query.trim().length < 2 ? 'Ketik minimal 2 karakter.' : 'Tidak ada hasil.' }}
      </li>
    </ul>
  </div>
</template>
