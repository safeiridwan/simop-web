<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { financeApi } from '../api'
import type { JournalDetail } from '../types'

const route = useRoute()
const id = route.params.id as string

const detail = ref<JournalDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    detail.value = await financeApi.getJournal(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat jurnal'
  } finally {
    loading.value = false
  }
})
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
    </template>
  </section>
</template>
