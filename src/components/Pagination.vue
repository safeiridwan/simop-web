<script setup lang="ts">
import { computed } from 'vue'

interface PageMeta {
  page: number
  page_size: number
  total: number
}

const props = defineProps<{ meta: PageMeta | null }>()
const emit = defineEmits<{ change: [page: number] }>()

const totalPages = computed(() =>
  props.meta ? Math.max(1, Math.ceil(props.meta.total / props.meta.page_size)) : 1,
)
const page = computed(() => props.meta?.page ?? 1)

function go(target: number) {
  if (target < 1 || target > totalPages.value || target === page.value) return
  emit('change', target)
}
</script>

<template>
  <div v-if="meta" class="mt-4 flex items-center justify-between gap-2 text-sm">
    <span class="text-slate-500">Hal. {{ page }} dari {{ totalPages }} · {{ meta.total }} data</span>
    <div class="flex gap-2">
      <button
        type="button"
        :disabled="page <= 1"
        class="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
        @click="go(page - 1)"
      >
        Sebelumnya
      </button>
      <button
        type="button"
        :disabled="page >= totalPages"
        class="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
        @click="go(page + 1)"
      >
        Berikutnya
      </button>
    </div>
  </div>
</template>
