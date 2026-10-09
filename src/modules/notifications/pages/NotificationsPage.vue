<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { notificationsApi } from '../api'
import { channelLabel, type Notification } from '../types'

const notifications = ref<Notification[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const statusFilter = ref('')

const unread = computed(() => notifications.value.filter((n) => n.status === 'UNREAD').length)

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data } = await notificationsApi.list({ status: statusFilter.value })
    notifications.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat notifikasi'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function markRead(id: string) {
  saving.value = true
  try {
    await notificationsApi.markRead(id)
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Operasi gagal'
  } finally {
    saving.value = false
  }
}

async function markAllRead() {
  saving.value = true
  try {
    await notificationsApi.markAllRead()
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Operasi gagal'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Notifikasi</h1>
        <p class="text-sm text-slate-500">{{ unread }} belum dibaca</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <router-link to="/notification-preferences" class="rounded border border-slate-300 px-3 py-2 text-sm">Preferensi</router-link>
        <button
          type="button"
          :disabled="saving || unread === 0"
          class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          @click="markAllRead"
        >
          Tandai semua dibaca
        </button>
      </div>
    </header>

    <div class="mb-4 flex flex-wrap gap-2">
      <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="load">
        <option value="">Semua</option>
        <option value="UNREAD">Belum dibaca</option>
        <option value="READ">Sudah dibaca</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="load">Muat ulang</button>
    </div>

    <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="notifications.length === 0" class="text-sm text-slate-500">Belum ada notifikasi.</p>

    <ul v-else class="space-y-2">
      <li
        v-for="n in notifications"
        :key="n.id"
        class="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
        :class="n.status === 'UNREAD' ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200 bg-white'"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-900">
            <span v-if="n.status === 'UNREAD'" class="mr-1 inline-block h-2 w-2 rounded-full bg-brand-500 align-middle" />
            {{ n.title }}
          </p>
          <p v-if="n.body" class="text-sm text-slate-600">{{ n.body }}</p>
          <p class="mt-1 text-xs text-slate-400">
            {{ channelLabel(n.channel) }} · {{ n.category || 'Umum' }} · {{ new Date(n.created_at).toLocaleString('id-ID') }}
          </p>
        </div>
        <button
          v-if="n.status === 'UNREAD'"
          type="button"
          :disabled="saving"
          class="shrink-0 text-xs text-brand-600 hover:underline disabled:opacity-50"
          @click="markRead(n.id)"
        >
          Tandai dibaca
        </button>
      </li>
    </ul>
  </section>
</template>
