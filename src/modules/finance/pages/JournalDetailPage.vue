<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { downloadFile } from '@/services/http'
import { useAuthStore } from '@/app/stores/auth'
import { financeApi } from '../api'
import type { JournalDetail, Receipt } from '../types'

const route = useRoute()
const id = route.params.id as string
const auth = useAuthStore()

const detail = ref<JournalDetail | null>(null)
const receipts = ref<Receipt[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [d, r] = await Promise.all([financeApi.getJournal(id), financeApi.listJournalReceipts(id)])
    detail.value = d
    receipts.value = r
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat jurnal'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function download(receipt: Receipt) {
  if (!receipt.file_id) return
  try {
    await downloadFile(`/api/v1/files/${receipt.file_id}`, `${receipt.receipt_number}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal mengunduh bukti'
  }
}

async function verify(receipt: Receipt) {
  saving.value = true
  try {
    await financeApi.verifyReceipt(receipt.id)
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memverifikasi'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="detail">
      <header class="mb-6">
        <router-link to="/finance/journals" class="text-sm text-brand-600 hover:underline">← Jurnal</router-link>
        <h1 class="text-xl font-semibold text-slate-900">{{ detail.journal.journal_number }}</h1>
        <p class="text-sm text-slate-500">{{ detail.journal.transaction_date }} · {{ detail.journal.status }}</p>
        <p v-if="detail.journal.description" class="text-sm text-slate-600">{{ detail.journal.description }}</p>
      </header>

      <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table class="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-left text-slate-500">
              <th class="p-3">Akun</th>
              <th class="p-3 text-right">Debit</th>
              <th class="p-3 text-right">Kredit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="line in detail.lines" :key="line.id" class="border-b border-slate-100">
              <td class="p-3 text-slate-900">{{ line.account_code }} {{ line.account_name }}</td>
              <td class="p-3 text-right text-slate-600">{{ line.debit ? line.debit.toLocaleString('id-ID') : '—' }}</td>
              <td class="p-3 text-right text-slate-600">{{ line.credit ? line.credit.toLocaleString('id-ID') : '—' }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-slate-50 font-medium">
              <td class="p-3 text-slate-900">Total</td>
              <td class="p-3 text-right text-slate-900">{{ detail.total_debit.toLocaleString('id-ID') }}</td>
              <td class="p-3 text-right text-slate-900">{{ detail.total_credit.toLocaleString('id-ID') }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p :class="detail.total_debit === detail.total_credit ? 'mt-3 text-sm text-green-700' : 'mt-3 text-sm text-amber-600'">
        {{ detail.total_debit === detail.total_credit ? 'Seimbang' : 'Tidak seimbang' }}
      </p>

      <div class="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Bukti Transaksi</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="rc in receipts" :key="rc.id" class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-slate-700">
              {{ rc.receipt_number }}
              <span class="text-xs text-slate-400">{{ rc.receipt_date || '' }}</span>
            </span>
            <span class="flex items-center gap-3">
              <span v-if="rc.verified_at" class="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700">Terverifikasi</span>
              <button
                v-if="rc.file_id"
                type="button"
                class="text-xs text-brand-600 hover:underline"
                @click="download(rc)"
              >
                Unduh
              </button>
              <button
                v-if="!rc.verified_at && auth.can('finance:update')"
                type="button"
                :disabled="saving"
                class="text-xs text-brand-600 hover:underline disabled:opacity-50"
                @click="verify(rc)"
              >
                Verifikasi
              </button>
            </span>
          </li>
          <li v-if="receipts.length === 0" class="text-slate-500">Belum ada bukti.</li>
        </ul>
      </div>
    </template>
  </section>
</template>
