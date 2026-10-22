<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import Pagination from '@/components/Pagination.vue'
import { formatDate } from '@/utils/date'
import { kaderisasiApi } from '../api'
import { truncateText, type GroupSession, type PageMeta } from '../types'

const route = useRoute()
const id = route.params.id as string

const sessions = ref<GroupSession[]>([])
const meta = ref<PageMeta | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(10)

const expandedText = ref<Set<string>>(new Set())
const expandedAttendees = ref<Set<string>>(new Set())

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await kaderisasiApi.listSessions(id, { page: page.value, pageSize: pageSize.value })
    sessions.value = res.data
    meta.value = res.meta ?? null
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat riwayat pelaksanaan'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onPageChange(target: number) {
  page.value = target
  void load()
}

function onPageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  void load()
}

function toggleText(sessionId: string) {
  const next = new Set(expandedText.value)
  if (next.has(sessionId)) next.delete(sessionId)
  else next.add(sessionId)
  expandedText.value = next
}

function toggleAttendees(sessionId: string) {
  const next = new Set(expandedAttendees.value)
  if (next.has(sessionId)) next.delete(sessionId)
  else next.add(sessionId)
  expandedAttendees.value = next
}
</script>

<template>
  <section>
    <header class="mb-6">
      <nav class="mb-1 text-xs text-slate-500" aria-label="Breadcrumb">
        <router-link to="/kaderisasi/grup-pembinaan" class="hover:underline">Grup Pembinaan</router-link>
        <span class="px-1">/</span>
        <router-link :to="`/kaderisasi/grup-pembinaan/${id}`" class="hover:underline">Detail Grup</router-link>
        <span class="px-1">/</span>
        <span>Riwayat Pelaksanaan Pembinaan</span>
      </nav>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-xl font-semibold text-slate-900">Riwayat Pelaksanaan Pembinaan</h1>
        <router-link :to="`/kaderisasi/grup-pembinaan/${id}`" class="text-sm text-brand-600 hover:underline">
          ← Kembali ke detail grup
        </router-link>
      </div>
    </header>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="sessions.length === 0" class="rounded border border-slate-200 bg-white p-4 text-sm text-slate-500">
      Belum ada riwayat pelaksanaan pembinaan untuk grup ini.
    </p>

    <template v-else>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[48rem] border-collapse text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-left text-slate-500">
              <th class="py-2 pr-4">Tanggal Pembinaan</th>
              <th class="py-2 pr-4">Materi</th>
              <th class="py-2 pr-4">Anggota yang Hadir</th>
              <th class="py-2">Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sessions" :key="s.id" class="border-b border-slate-100 align-top">
              <td class="py-2 pr-4 whitespace-nowrap text-slate-900">{{ formatDate(s.session_date) }}</td>
              <td class="py-2 pr-4 text-slate-600">
                <template v-if="s.material">
                  <span :title="s.material">{{ expandedText.has(s.id) ? s.material : truncateText(s.material) }}</span>
                  <button
                    v-if="s.material.length > 60"
                    type="button"
                    class="ml-1 text-xs text-brand-600 hover:underline"
                    @click="toggleText(s.id)"
                  >
                    {{ expandedText.has(s.id) ? 'Ringkas' : 'Selengkapnya' }}
                  </button>
                </template>
                <span v-else>-</span>
              </td>
              <td class="py-2 pr-4 text-slate-600">
                <button
                  type="button"
                  class="text-brand-600 hover:underline"
                  :aria-expanded="expandedAttendees.has(s.id)"
                  @click="toggleAttendees(s.id)"
                >
                  {{ s.attendees.length }} orang
                </button>
                <ul v-if="expandedAttendees.has(s.id)" class="mt-1 space-y-0.5 text-xs text-slate-600">
                  <li v-for="a in s.attendees" :key="a.cadre_profile_id">{{ a.person_code }} - {{ a.full_name }}</li>
                </ul>
              </td>
              <td class="py-2 text-slate-600">
                <span v-if="s.notes" :title="s.notes">{{ truncateText(s.notes) }}</span>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination :meta="meta" @change="onPageChange" @page-size-change="onPageSizeChange" />
    </template>
  </section>
</template>
