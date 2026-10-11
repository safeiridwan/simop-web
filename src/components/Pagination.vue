<script setup lang="ts">
import { computed } from 'vue'

interface PageMeta {
  page: number
  page_size: number
  total: number
}

const props = withDefaults(
  defineProps<{
    meta: PageMeta | null
    pageSizes?: number[]
  }>(),
  { pageSizes: () => [10, 20, 50, 100] },
)
const emit = defineEmits<{
  change: [page: number]
  'page-size-change': [size: number]
}>()

const totalPages = computed(() =>
  props.meta ? Math.max(1, Math.ceil(props.meta.total / props.meta.page_size)) : 1,
)
const page = computed(() => props.meta?.page ?? 1)

/** Windowed page numbers with ellipsis markers (0). */
const pages = computed<(number)[]>(() => {
  const total = totalPages.value
  const current = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out = new Set<number>([1, total, current])
  for (let d = 1; d <= 1; d++) {
    if (current - d > 1) out.add(current - d)
    if (current + d < total) out.add(current + d)
  }
  const sorted = [...out].sort((a, b) => a - b)
  const result: number[] = []
  let prev = 0
  for (const n of sorted) {
    if (prev && n - prev > 1) result.push(0)
    result.push(n)
    prev = n
  }
  return result
})

function go(target: number) {
  if (target < 1 || target > totalPages.value || target === page.value) return
  emit('change', target)
}

function onPageSize(event: Event) {
  emit('page-size-change', Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <div v-if="meta" class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
    <span class="text-slate-500">Hal. {{ page }} dari {{ totalPages }} · {{ meta.total }} data</span>

    <div class="flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-slate-600">
        Tampilkan
        <select
          :value="meta.page_size"
          class="rounded border border-slate-300 px-2 py-1 text-sm"
          @change="onPageSize"
        >
          <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>

      <div class="flex flex-wrap items-center gap-1">
        <button
          type="button"
          :disabled="page <= 1"
          class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
          @click="go(page - 1)"
        >
          Sebelumnya
        </button>
        <template v-for="(p, i) in pages" :key="i">
          <span v-if="p === 0" class="px-1 text-slate-400">…</span>
          <button
            v-else
            type="button"
            class="min-w-[2rem] rounded border px-2 py-1"
            :class="p === page ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 text-slate-700'"
            @click="go(p)"
          >
            {{ p }}
          </button>
        </template>
        <button
          type="button"
          :disabled="page >= totalPages"
          class="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
          @click="go(page + 1)"
        >
          Berikutnya
        </button>
      </div>
    </div>
  </div>
</template>
