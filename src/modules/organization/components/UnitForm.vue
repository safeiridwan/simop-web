<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

import type { CreateUnitInput, Unit, UnitType } from '../types'

const props = withDefaults(
  defineProps<{
    types: UnitType[]
    parentOptions?: Unit[]
    initial?: Partial<CreateUnitInput>
    submitLabel?: string
    submitting?: boolean
    lockType?: boolean
  }>(),
  { parentOptions: () => [], submitLabel: 'Simpan', submitting: false, lockType: false },
)

const emit = defineEmits<{ submit: [CreateUnitInput] }>()

const form = reactive<CreateUnitInput>({
  parent_id: props.initial?.parent_id ?? null,
  unit_type_id: props.initial?.unit_type_id ?? '',
  code: props.initial?.code ?? '',
  name: props.initial?.name ?? '',
  status: props.initial?.status ?? 'ACTIVE',
})

watch(
  () => props.initial,
  (v) => {
    if (!v) return
    form.parent_id = v.parent_id ?? null
    form.unit_type_id = v.unit_type_id ?? form.unit_type_id
    form.code = v.code ?? form.code
    form.name = v.name ?? form.name
    form.status = v.status ?? form.status
  },
)

const selectedType = computed(() => props.types.find((t) => t.id === form.unit_type_id))
const allowedParentTypeIDs = computed(() => selectedType.value?.allowed_parent_type_ids ?? [])
const eligibleParents = computed(() =>
  props.parentOptions.filter((u) => allowedParentTypeIDs.value.includes(u.unit_type_id)),
)

function onSubmit() {
  emit('submit', { ...form, parent_id: form.parent_id || null })
}
</script>

<template>
  <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="onSubmit">
    <div>
      <label class="block text-sm font-medium text-slate-700" for="u-type">Tipe Unit</label>
      <select
        id="u-type"
        v-model="form.unit_type_id"
        :disabled="lockType"
        required
        class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
        @change="form.parent_id = null"
      >
        <option value="" disabled>Pilih tipe</option>
        <option v-for="t in types" :key="t.id" :value="t.id">{{ t.name }} ({{ t.code }})</option>
      </select>
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700" for="u-parent">Induk</label>
      <select id="u-parent" v-model="form.parent_id" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
        <option :value="null">{{ allowedParentTypeIDs.length ? '— Pilih induk —' : '— Tanpa induk (root) —' }}</option>
        <option v-for="u in eligibleParents" :key="u.id" :value="u.id">{{ u.name }} ({{ u.code }})</option>
      </select>
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700" for="u-code">Kode</label>
      <input id="u-code" v-model="form.code" :readonly="!!initial?.code" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm readonly:bg-slate-100" />
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700" for="u-name">Nama</label>
      <input id="u-name" v-model="form.name" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700" for="u-status">Status</label>
      <select id="u-status" v-model="form.status" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="ACTIVE">Aktif</option>
        <option value="INACTIVE">Tidak aktif</option>
      </select>
    </div>
    <div class="flex items-end">
      <button
        type="submit"
        :disabled="submitting"
        class="rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {{ submitting ? 'Menyimpan...' : submitLabel }}
      </button>
    </div>
  </form>
</template>
