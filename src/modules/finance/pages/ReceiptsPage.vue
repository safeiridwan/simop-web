<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { useAuthStore } from '@/app/stores/auth'
import { financeApi } from '../api'
import type { Receipt } from '../types'

const auth = useAuthStore()
const receipts = ref<Receipt[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    receipts.value = await financeApi.listAllReceipts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat bukti transaksi'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function verify(id: string) {
  saving.value = true
  try {
    await financeApi.verifyReceipt(id)
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memverifikasi'
  } finally {
    saving.value = false
  }
}

function source(r: Receipt): string {
  if (r.journal_entry_id) return 'Jurnal'
  if (r.reimbursement_id) return 'SPJ'
  return '—'
}
</script>

<template>
  <section>
    <header class="mb-6">
      <h1 class="text-xl font-semibold text-slate-900">Bukti Transaksi</h1>
      <p class="text-sm text-slate-500">{{ receipts.length }} bukti</p>
    </header>

    <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="receipts.length === 0" class="text-sm text-slate-500">Belum ada bukti transaksi.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[38rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Nomor</th>
            <th class="py-2 pr-4">Tanggal</th>
            <th class="py-2 pr-4">Sumber</th>
            <th class="py-2 pr-4">Status</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in receipts" :key="r.id" class="border-b border-slate-100">
            <td class="py-2 pr-4 font-mono text-xs text-slate-700">{{ r.receipt_number }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ r.receipt_date || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ source(r) }}</td>
            <td class="py-2 pr-4">
              <span v-if="r.verified_at" class="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700">Terverifikasi</span>
              <span v-else class="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">Belum</span>
            </td>
            <td class="py-2">
              <button
                v-if="!r.verified_at && auth.can('finance:update')"
                type="button"
                :disabled="saving"
                class="text-xs text-brand-600 hover:underline disabled:opacity-50"
                @click="verify(r.id)"
              >
                Verifikasi
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
