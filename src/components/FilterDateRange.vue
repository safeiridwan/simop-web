<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  from: string
  to: string
  label: string
}>()
const emit = defineEmits<{
  'update:from': [value: string]
  'update:to': [value: string]
  change: []
}>()

const invalid = computed(() => props.from !== '' && props.to !== '' && props.from > props.to)
</script>

<template>
  <div>
    <div class="flex items-center gap-1">
      <input
        :value="from"
        type="date"
        class="w-full rounded border border-slate-300 px-2 py-1 text-xs font-normal"
        :aria-label="`${label} dari`"
        :aria-invalid="invalid"
        @input="emit('update:from', ($event.target as HTMLInputElement).value); emit('change')"
      />
      <span class="text-xs text-slate-400">s/d</span>
      <input
        :value="to"
        type="date"
        class="w-full rounded border border-slate-300 px-2 py-1 text-xs font-normal"
        :aria-label="`${label} sampai`"
        :aria-invalid="invalid"
        @input="emit('update:to', ($event.target as HTMLInputElement).value); emit('change')"
      />
    </div>
    <p v-if="invalid" class="mt-1 text-xs text-red-600">Tanggal awal tidak boleh lebih besar dari tanggal akhir.</p>
  </div>
</template>
