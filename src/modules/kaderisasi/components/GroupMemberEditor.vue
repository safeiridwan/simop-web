<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { CadreProfile } from '@/modules/cadre/types'
import type { GroupMemberRow } from '../types'
import CadrePicker from './CadrePicker.vue'

const props = defineProps<{
  modelValue: GroupMemberRow[]
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [rows: GroupMemberRow[]] }>()

const rows = ref<GroupMemberRow[]>([])

watch(
  () => props.modelValue,
  (value) => {
    if (value === rows.value) return
    rows.value = value.map((r) => ({ ...r }))
  },
  { immediate: true, deep: true },
)

const duplicateIds = computed(() => {
  const seen = new Set<string>()
  const dup = new Set<string>()
  for (const r of rows.value) {
    if (!r.cadre_profile_id) continue
    if (seen.has(r.cadre_profile_id)) dup.add(r.cadre_profile_id)
    seen.add(r.cadre_profile_id)
  }
  return dup
})

function commit() {
  emit('update:modelValue', rows.value.map((r) => ({ ...r })))
}

function addRow() {
  rows.value.push({ cadre_profile_id: '', full_name: '', person_code: '', level_name: '', status: '' })
}

function removeRow(index: number) {
  rows.value.splice(index, 1)
  commit()
}

function onSelect(index: number, profile: CadreProfile) {
  const row = rows.value[index]
  row.cadre_profile_id = profile.id
  row.full_name = profile.full_name
  row.person_code = profile.person_code
  row.level_name = profile.level_name
  row.status = profile.status
  commit()
}
</script>

<template>
  <div class="rounded-lg border border-slate-200">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 px-3">Kader</th>
            <th class="py-2 px-3">Jenjang</th>
            <th class="py-2 px-3">Status</th>
            <th class="py-2 px-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="index" class="border-b border-slate-100 align-top">
            <td class="py-2 px-3">
              <CadrePicker
                v-model="row.cadre_profile_id"
                :disabled="disabled"
                @select="onSelect(index, $event)"
              />
              <p v-if="duplicateIds.has(row.cadre_profile_id)" class="mt-1 text-xs text-red-600">
                Kader ini sudah ada pada baris lain.
              </p>
            </td>
            <td class="py-2 px-3 text-slate-600">{{ row.level_name || '—' }}</td>
            <td class="py-2 px-3 text-slate-600">{{ row.status || '—' }}</td>
            <td class="py-2 px-3">
              <button type="button" :disabled="disabled" class="text-xs text-red-600 hover:underline" @click="removeRow(index)">Hapus</button>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="4" class="py-3 px-3 text-slate-500">Belum ada anggota.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="border-t border-slate-100 p-3">
      <button type="button" class="rounded border border-slate-300 px-3 py-1.5 text-sm" :disabled="disabled" @click="addRow">
        Tambah Baris
      </button>
    </div>
  </div>
</template>
