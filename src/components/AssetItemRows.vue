<script setup lang="ts">
import { ref, watch } from 'vue'

import { ASSET_CONDITIONS, conditionSummary, conditionsTotal, type AssetCategory, type TransactionItemInput } from '@/modules/assets/types'

interface Row extends TransactionItemInput {
  editing: boolean
}

const props = defineProps<{
  modelValue: TransactionItemInput[]
  categories: AssetCategory[]
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [rows: TransactionItemInput[]] }>()

const rows = ref<Row[]>([])

watch(
  () => props.modelValue,
  (value) => {
    if (value === rows.value) return
    rows.value = value.map((r) => ({ ...r, conditions: { ...r.conditions }, editing: false }))
  },
  { immediate: true, deep: true },
)

function commit() {
  emit(
    'update:modelValue',
    rows.value.map((r) => ({ category_id: r.category_id, quantity: r.quantity, conditions: { ...r.conditions } })),
  )
}

function categoryLabel(id: string): string {
  const c = props.categories.find((x) => x.id === id)
  return c ? `${c.code} - ${c.name}` : '—'
}

function addRow() {
  rows.value.push({ category_id: '', quantity: 1, conditions: {}, editing: true })
}

function removeRow(index: number) {
  rows.value.splice(index, 1)
  commit()
}

function startEdit(index: number) {
  rows.value[index].editing = true
}

function rowValid(row: Row): boolean {
  return row.category_id !== '' && row.quantity > 0 && conditionsTotal(row.conditions) === row.quantity
}

function finishEdit(index: number) {
  const row = rows.value[index]
  if (!rowValid(row)) return
  row.editing = false
  commit()
}
</script>

<template>
  <div class="rounded-lg border border-slate-200">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 px-3">Kategori Aset</th>
            <th class="py-2 px-3 text-right">Unit</th>
            <th class="py-2 px-3">Kondisi</th>
            <th class="py-2 px-3">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="index" class="border-b border-slate-100 align-top">
            <td class="py-2 px-3">
              <select
                v-if="row.editing"
                v-model="row.category_id"
                class="w-full min-w-[10rem] rounded border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="" disabled>Pilih kategori</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.code }} - {{ c.name }}</option>
              </select>
              <span v-else class="text-slate-900">{{ categoryLabel(row.category_id) }}</span>
            </td>
            <td class="py-2 px-3 text-right">
              <input
                v-if="row.editing"
                v-model.number="row.quantity"
                type="number"
                min="1"
                step="1"
                class="w-20 rounded border border-slate-300 px-2 py-1 text-right text-sm"
              />
              <span v-else class="text-slate-900">{{ row.quantity }}</span>
            </td>
            <td class="py-2 px-3">
              <template v-if="row.editing">
                <div class="flex flex-wrap gap-2">
                  <label v-for="c in ASSET_CONDITIONS" :key="c.value" class="flex items-center gap-1 text-xs text-slate-600">
                    {{ c.label }}
                    <input
                      v-model.number="row.conditions[c.value]"
                      type="number"
                      min="0"
                      step="1"
                      class="w-14 rounded border border-slate-300 px-1 py-0.5 text-right text-xs"
                    />
                  </label>
                </div>
                <p class="mt-1 text-xs" :class="conditionsTotal(row.conditions) === row.quantity ? 'text-green-700' : 'text-amber-600'">
                  Total rincian: {{ conditionsTotal(row.conditions) }} / {{ row.quantity }}
                </p>
              </template>
              <span v-else class="text-slate-600">{{ conditionSummary(row.conditions) }}</span>
            </td>
            <td class="py-2 px-3">
              <button
                v-if="row.editing"
                type="button"
                class="mr-2 text-xs text-brand-600 hover:underline disabled:opacity-50"
                :disabled="!rowValid(row)"
                @click="finishEdit(index)"
              >
                Simpan
              </button>
              <button v-else type="button" class="mr-2 text-xs text-brand-600 hover:underline" @click="startEdit(index)">Edit</button>
              <button type="button" class="text-xs text-red-600 hover:underline" @click="removeRow(index)">Hapus</button>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="4" class="py-3 px-3 text-slate-500">Belum ada aset.</td>
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
