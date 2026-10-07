<script setup lang="ts">
import { ref, watch } from 'vue'

import { peopleApi } from '@/modules/people/api'
import type { Person } from '@/modules/people/types'

const model = defineModel<Person | null>()
const query = ref('')
const results = ref<Person[]>([])
const open = ref(false)
const loading = ref(false)
let timer: number | undefined

watch(query, (q) => {
  window.clearTimeout(timer)
  if (!q || q.trim().length < 2) {
    results.value = []
    open.value = false
    return
  }
  timer = window.setTimeout(async () => {
    loading.value = true
    try {
      const { data } = await peopleApi.list({ search: q.trim() })
      results.value = data
      open.value = true
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }, 250)
})

function select(person: Person) {
  model.value = person
  query.value = person.full_name
  open.value = false
  results.value = []
}

function clear() {
  model.value = null
  query.value = ''
  results.value = []
}
</script>

<template>
  <div class="relative">
    <div class="flex gap-2">
      <input
        v-model="query"
        placeholder="Cari nama atau kode orang"
        class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        @focus="open = results.length > 0"
      />
      <button
        v-if="model"
        type="button"
        class="shrink-0 rounded border border-slate-300 px-3 py-2 text-sm"
        @click="clear"
      >
        Hapus
      </button>
    </div>

    <p v-if="model" class="mt-1 text-xs text-slate-500">
      Dipilih: <span class="font-medium text-slate-700">{{ model.full_name }}</span>
      ({{ model.person_code }})
    </p>

    <ul
      v-if="open && results.length"
      class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-slate-200 bg-white shadow-lg"
    >
      <li v-for="person in results" :key="person.id">
        <button
          type="button"
          class="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
          @click="select(person)"
        >
          {{ person.full_name }}
          <span class="font-mono text-xs text-slate-400">{{ person.person_code }}</span>
        </button>
      </li>
    </ul>
    <p v-else-if="open && !loading" class="absolute z-10 mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
      Tidak ada hasil.
    </p>
  </div>
</template>
