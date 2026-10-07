<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { membersApi } from '../api'
import { MEMBER_STATUSES, memberStatusLabel, type Member, type MemberHistory } from '../types'

const route = useRoute()
const id = route.params.id as string

const member = ref<Member | null>(null)
const history = ref<MemberHistory[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const statusForm = reactive({ status: '', reason: '' })
const editForm = reactive({ join_date: '', membership_source: '' })

async function refresh() {
  loading.value = true
  try {
    member.value = await membersApi.get(id)
    history.value = await membersApi.history(id)
    statusForm.status = member.value.status
    editForm.join_date = member.value.join_date ?? ''
    editForm.membership_source = member.value.membership_source ?? ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

onMounted(() => void refresh())

async function changeStatus() {
  saving.value = true
  error.value = null
  try {
    await membersApi.changeStatus(id, statusForm.status, statusForm.reason || undefined)
    statusForm.reason = ''
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal mengubah status'
  } finally {
    saving.value = false
  }
}

async function saveDetails() {
  saving.value = true
  error.value = null
  try {
    await membersApi.update(id, {
      join_date: editForm.join_date || undefined,
      membership_source: editForm.membership_source || undefined,
    })
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan'
  } finally {
    saving.value = false
  }
}

async function verify() {
  saving.value = true
  try {
    await membersApi.verify(id)
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal verifikasi'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="member">
      <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <router-link to="/members" class="text-sm text-brand-600 hover:underline">← Anggota</router-link>
          <h1 class="text-xl font-semibold text-slate-900">{{ member.full_name }}</h1>
          <p class="font-mono text-xs text-slate-500">{{ member.member_number }} · {{ member.person_code }}</p>
        </div>
        <button
          v-if="!member.verified_at"
          type="button"
          :disabled="saving"
          class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:w-fit"
          @click="verify"
        >
          Verifikasi
        </button>
        <span v-else class="rounded bg-green-50 px-3 py-2 text-sm text-green-700 sm:w-fit">Terverifikasi</span>
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="space-y-6">
          <div class="rounded-lg border border-slate-200 bg-white p-4">
            <h2 class="mb-3 font-semibold text-slate-900">Data Keanggotaan</h2>
            <dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div><dt class="text-slate-500">Status</dt><dd class="text-slate-900">{{ memberStatusLabel(member.status) }}</dd></div>
              <div><dt class="text-slate-500">Tanggal Gabung</dt><dd class="text-slate-900">{{ member.join_date || '—' }}</dd></div>
              <div><dt class="text-slate-500">Sumber</dt><dd class="text-slate-900">{{ member.membership_source || '—' }}</dd></div>
              <div><dt class="text-slate-500">Diverifikasi</dt><dd class="text-slate-900">{{ member.verified_at ? 'Ya' : 'Belum' }}</dd></div>
            </dl>
            <form class="mt-4 grid gap-3 sm:grid-cols-2" @submit.prevent="saveDetails">
              <div>
                <label class="block text-sm font-medium text-slate-700" for="m-det-join">Tanggal Gabung</label>
                <input id="m-det-join" v-model="editForm.join_date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700" for="m-det-source">Sumber</label>
                <input id="m-det-source" v-model="editForm.membership_source" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2 sm:w-fit">
                Simpan
              </button>
            </form>
          </div>

          <div class="rounded-lg border border-slate-200 bg-white p-4">
            <h2 class="mb-3 font-semibold text-slate-900">Ubah Status</h2>
            <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="changeStatus">
              <div>
                <label class="block text-sm font-medium text-slate-700" for="m-status">Status Baru</label>
                <select id="m-status" v-model="statusForm.status" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
                  <option v-for="s in MEMBER_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700" for="m-reason">Alasan</label>
                <input id="m-reason" v-model="statusForm.reason" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <button
                type="submit"
                :disabled="saving"
                class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit"
              >
                Simpan Status
              </button>
            </form>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Riwayat Status</h2>
          <ol class="space-y-3 text-sm">
            <li v-for="entry in history" :key="entry.id" class="border-l-2 border-brand-200 pl-3">
              <p class="text-slate-900">
                {{ entry.old_status ? memberStatusLabel(entry.old_status) + ' → ' : '' }}{{ memberStatusLabel(entry.new_status) }}
              </p>
              <p class="text-xs text-slate-500">
                {{ new Date(entry.effective_at).toLocaleString('id-ID') }}
                <span v-if="entry.reason"> · {{ entry.reason }}</span>
              </p>
            </li>
            <li v-if="history.length === 0" class="text-slate-500">Belum ada riwayat.</li>
          </ol>
        </div>
      </div>
    </template>
  </section>
</template>
