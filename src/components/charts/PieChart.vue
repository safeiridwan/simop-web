<script setup lang="ts">
import { ArcElement, Chart, Legend, PieController, Tooltip } from 'chart.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

Chart.register(ArcElement, PieController, Tooltip, Legend)

const props = defineProps<{
  labels: string[]
  values: number[]
  colors?: string[]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const palette = () => props.colors ?? ['#2563eb', '#16a34a', '#f59e0b', '#94a3b8']

function render() {
  if (!canvas.value) return
  chart?.destroy()
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
              const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0)
              const value = Number(ctx.raw)
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
              return `${ctx.label}: ${value} (${pct}%)`
            },
          },
        },
      },
    },
  })
}

onMounted(render)
watch(() => [props.labels, props.values], render, { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>

<template>
  <div class="relative h-64">
    <canvas ref="canvas" role="img" :aria-label="`Komposisi tipe program: ${labels.join(', ')}`" />
  </div>
</template>
