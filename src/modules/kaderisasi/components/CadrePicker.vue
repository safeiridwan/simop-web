<script setup lang="ts">
import { ref, watch } from 'vue'

import { cadreApi } from '@/modules/cadre/api'
import type { CadreProfile } from '@/modules/cadre/types'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [profile: CadreProfile]
}>()

const query = ref('')
const results = ref<CadreProfile[]>([])
const open = ref(false)
const loading = ref(false)
const selected = ref<CadreProfile | null>(null)
let timer: number | undefined

function label(c: CadreProfile): string {
  return `${c.person_code} - ${c.full_name}`
}

watch(
  () => props.modelValue,
  async (id) => {
    if (!id) {
      selected.value = null
      query.value = ''
      return
    }
    if (selected.value?.id === id) return
    try {
      selected.value = await cadreApi.get(id)
      query.value = label(selected.value)
    } catch {
      selected.value = null
    }
  },
  { immediate: true },
)

watch(query, (q) => {
  window.clearTimeout(timer)
  if (selected.value && q === label(selected.value)) {
    results.value = []
    open.value = false
    return
  }
  if (!q || q.trim().length < 2) {
    results.value = []
    open.value = false
    return
  }
  timer = window.setTimeout(async () => {
    loading.value = true
    try {
      const { data } = await cadreApi.list({ search: q.trim(), pageSize: 10 })
      results.value = data
      open.value = true
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }, 250)
})

function choose(profile: CadreProfile) {
  selected.value = profile
  query.value = label(profile)
  open.value = false
  results.value = []
  emit('update:modelValue', profile.id)
  emit('select', profile)
}

function clear() {
  selected.value = null
  query.value = ''
  results.value = []
  emit('update:modelValue', '')
}

function onBlur() {
  open.value = false
}
</script>

<template>
  <div class="relative">
    <div class="flex gap-2">
      <input
        v-model="query"
        :placeholder="placeholder ?? 'Cari nama atau nomor anggota'"
        :disabled="disabled"
        class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        @focus="open = results.length > 0"
        @blur="onBlur"
      />
      <button
        v-if="selected"
        type="button"
        :disabled="disabled"
        class="shrink-0 rounded border border-slate-300 px-3 py-2 text-sm"
        @click="clear"
      >
        Hapus
      </button>
    </div>

    <ul
      v-if="open && results.length"
      class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-slate-200 bg-white shadow-lg"
    >
      <li v-for="c in results" :key="c.id">
        <button
          type="button"
          class="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
          @mousedown.prevent="choose(c)"
        >
          {{ c.person_code }} - {{ c.full_name }}
          <span class="text-xs text-slate-500">({{ c.level_name }})</span>
        </button>
      </li>
    </ul>
    <p v-else-if="open && !loading" class="absolute z-10 mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
      Tidak ada hasil.
    </p>
  </div>
</template>
