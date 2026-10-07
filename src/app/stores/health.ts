import { ref } from 'vue'
import { defineStore } from 'pinia'

import { healthApi } from '@/modules/health/api'

export type HealthState = 'unknown' | 'ok' | 'error'

export const useHealthStore = defineStore('health', () => {
  const status = ref<HealthState>('unknown')

  async function check(): Promise<void> {
    try {
      const result = await healthApi.check()
      status.value = result.status === 'ok' ? 'ok' : 'error'
    } catch {
      status.value = 'error'
    }
  }

  return { status, check }
})
