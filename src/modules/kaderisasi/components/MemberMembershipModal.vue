<script setup lang="ts">
import { ref, watch } from 'vue'

import AppModal from '@/components/AppModal.vue'
import { CADRE_STATUSES } from '@/modules/cadre/types'
import { affiliationTypeLabel } from '@/modules/non-party/types'
import { memberStatusLabel } from '@/modules/members/types'
import { kaderisasiApi } from '../api'
import type { MembershipProfile } from '../types'

const props = defineProps<{
  open: boolean
  groupId: string
  member: { id: string; full_name: string; person_code: string } | null
}>()
const emit = defineEmits<{ close: [] }>()

const profile = ref<MembershipProfile | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

watch(
  () => [props.open, props.member?.id] as const,
  async ([open, memberId]) => {
    if (!open || !memberId) return
    loading.value = true
    error.value = null
    profile.value = null
    try {
      profile.value = await kaderisasiApi.getMembershipProfile(props.groupId, memberId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Gagal memuat detail keanggotaan'
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

function cadreStatusLabel(status: string): string {
  return CADRE_STATUSES.find((s) => s.value === status)?.label ?? status
}

function affiliationStatusLabel(status: string): string {
  return status === 'ACTIVE' ? 'Aktif' : 'Tidak aktif'
}
</script>

<template>
  <AppModal :open="open" title="Detail Anggota" message="" @close="emit('close')">
    <p v-if="loading" class="text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>

    <div v-else-if="profile" class="space-y-4">
      <div>
        <p class="font-medium text-slate-900">{{ profile.person.person_code }} - {{ profile.person.full_name }}</p>
      </div>

      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Anggota Partai</h3>
        <dl v-if="profile.party_member" class="mt-1 grid grid-cols-2 gap-1">
          <dt class="text-slate-500">Nomor Anggota</dt>
          <dd class="text-slate-900">{{ profile.party_member.member_number }}</dd>
          <dt class="text-slate-500">Status</dt>
          <dd class="text-slate-900">{{ memberStatusLabel(profile.party_member.status) }}</dd>
        </dl>
        <p v-else class="mt-1 text-slate-500">Bukan anggota partai.</p>
      </div>

      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Kader</h3>
        <dl v-if="profile.cadre" class="mt-1 grid grid-cols-2 gap-1">
          <dt class="text-slate-500">Jenjang</dt>
          <dd class="text-slate-900">{{ profile.cadre.level_name }}</dd>
          <dt class="text-slate-500">Status Kader</dt>
          <dd class="text-slate-900">{{ cadreStatusLabel(profile.cadre.status) }}</dd>
        </dl>
        <p v-else class="mt-1 text-slate-500">Bukan kader.</p>
      </div>

      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Peran Non-Kader</h3>
        <ul v-if="profile.affiliations.length" class="mt-1 space-y-1">
          <li v-for="(a, index) in profile.affiliations" :key="index" class="flex items-center justify-between gap-3">
            <span class="text-slate-900">{{ affiliationTypeLabel(a.affiliation_type) }}</span>
            <span class="text-xs text-slate-500">{{ affiliationStatusLabel(a.status) }}</span>
          </li>
        </ul>
        <p v-else class="mt-1 text-slate-500">Tidak ada peran non-kader.</p>
      </div>
    </div>
  </AppModal>
</template>
