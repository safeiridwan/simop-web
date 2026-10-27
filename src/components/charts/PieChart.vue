<script setup lang="ts">
import { ArcElement, Chart, Legend, PieController, Tooltip } from 'chart.js'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

Chart.register(ArcElement, PieController, Tooltip, Legend)

const props = withDefaults(
  defineProps<{
    labels: string[]
    values: number[]
    colors?: string[]
    /** Renders a neutral placeholder ring; used for empty data and errors. */
    disabled?: boolean
    emptyLabel?: string
    ariaLabel?: string
  }>(),
  { disabled: false, emptyLabel: 'Belum ada data', ariaLabel: 'Komposisi data' },
)

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const total = computed(() => props.values.reduce((sum, value) => sum + Number(value || 0), 0))
const isPlaceholder = computed(() => props.disabled || total.value <= 0)

const palette = () => props.colors ?? ['#2563eb', '#16a34a', '#f59e0b', '#94a3b8', '#a855f7', '#ef4444']

function render() {
  chart?.destroy()
  chart = null
  if (!canvas.value || isPlaceholder.value) return
  chart = new Chart(canvas.value, {
    type: 'pie',
    data: {
      labels: props.labels,
      datasets: [{ data: props.values, backgroundColor: palette() }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label(ctx) {
              const sum = (ctx.dataset.data as number[]).reduce((a, b) => a + Number(b || 0), 0)
              const value = Number(ctx.raw)
              const pct = sum > 0 ? ((value / sum) * 100).toFixed(1) : '0'
              return `${ctx.label}: ${value} (${pct}%)`
            },
          },
        },
      },
    },
  })
}

onMounted(render)
watch(() => [props.labels, props.values, props.disabled], render, { deep: true, flush: 'post' })
onBeforeUnmount(() => chart?.destroy())
</script>

<template>
  <div class="relative flex h-64 items-center justify-center">
    <div
      v-if="isPlaceholder"
      class="flex h-40 w-40 items-center justify-center rounded-full border-[18px] border-slate-200 opacity-70"
      role="img"
      :aria-label="emptyLabel"
    >
      <span class="px-6 text-center text-xs text-slate-500">{{ emptyLabel }}</span>
    </div>
    <canvas v-else ref="canvas" role="img" :aria-label="ariaLabel" />
  </div>
</template>
