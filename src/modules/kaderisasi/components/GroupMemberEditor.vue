<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { CADRE_STATUSES } from '@/modules/cadre/types'
import type { CadreOption } from '../api'
import type { GroupMemberRow } from '../types'
import CadrePicker from './CadrePicker.vue'

const props = defineProps<{
  modelValue: GroupMemberRow[]
  /** Existing group (edit mode) so the lookup can exclude its members. */
  groupId?: string
  /** The selected Murabbi, who may not also be a member. */
  murabbiId?: string
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [rows: GroupMemberRow[]] }>()

const rows = ref<GroupMemberRow[]>([])
const picker = ref('')

watch(
  () => props.modelValue,
  (value) => {
    if (value === rows.value) return
    rows.value = value.map((r) => ({ ...r }))
  },
  { immediate: true, deep: true },
)

const excludedIds = computed(() => [
  ...rows.value.map((r) => r.cadre_profile_id).filter(Boolean),
  ...(props.murabbiId ? [props.murabbiId] : []),
])

function statusLabel(status: string): string {
  return CADRE_STATUSES.find((s) => s.value === status)?.label ?? status
}

function commit() {
  emit('update:modelValue', rows.value.map((r) => ({ ...r })))
}

function onSelect(option: CadreOption) {
  if (excludedIds.value.includes(option.id)) return
  rows.value.push({
    cadre_profile_id: option.id,
    full_name: option.full_name,
    person_code: option.person_code,
    level_name: option.level_name,
    status: option.status,
  })
  picker.value = ''
  commit()
}

function removeRow(index: number) {
  rows.value.splice(index, 1)
  commit()
}
</script>

<template>
  <div class="rounded-lg border border-slate-200">
    <div class="border-b border-slate-100 p-3">
      <label class="mb-1 block text-sm font-medium text-slate-700">Tambah anggota</label>
      <div class="sm:max-w-md">
        <CadrePicker
          v-model="picker"
          :group-id="groupId"
          :exclude-ids="excludedIds"
          :disabled="disabled"
          clear-on-select
          placeholder="Cari nama atau nomor anggota untuk menambah baris"
          @select="onSelect"
        />
      </div>
      <p class="mt-1 text-xs text-slate-500">Pilih satu kader untuk menambahkan baris anggota.</p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 px-3">Kader</th>
            <th class="py-2 px-3">Jenjang</th>
            <th class="py-2 px-3">Status</th>
            <th class="py-2 px-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="row.cadre_profile_id" class="border-b border-slate-100">
            <td class="py-2 px-3 text-slate-900">{{ row.person_code }} - {{ row.full_name }}</td>
            <td class="py-2 px-3 text-slate-600">{{ row.level_name || '-' }}</td>
            <td class="py-2 px-3 text-slate-600">{{ statusLabel(row.status) }}</td>
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
  </div>
</template>
