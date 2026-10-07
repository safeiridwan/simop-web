<script setup lang="ts">
import { onMounted, ref } from 'vue'

import TreeNode from '../components/TreeNode.vue'
import UnitForm from '../components/UnitForm.vue'
import { organizationApi } from '../api'
import type { CreateUnitInput, Unit, UnitNode, UnitType } from '../types'

const tree = ref<UnitNode[]>([])
const flatUnits = ref<Unit[]>([])
const types = ref<UnitType[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const showForm = ref(false)
const submitting = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [treeData, listData, typeData] = await Promise.all([
      organizationApi.tree(),
      organizationApi.listUnits({ pageSize: 200 }),
      organizationApi.unitTypes(),
    ])
    tree.value = treeData
    flatUnits.value = listData.data
    types.value = typeData
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat struktur organisasi'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function onCreate(input: CreateUnitInput) {
  submitting.value = true
  error.value = null
  try {
    await organizationApi.createUnit(input)
    showForm.value = false
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan unit'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Struktur Organisasi</h1>
        <p class="text-sm text-slate-500">{{ flatUnits.length }} unit</p>
      </div>
      <button
        type="button"
        class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Batal' : 'Tambah Unit' }}
      </button>
    </header>

    <div v-if="showForm" class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <UnitForm :types="types" :parent-options="flatUnits" :submitting="submitting" submit-label="Simpan" @submit="onCreate" />
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="tree.length === 0" class="text-sm text-slate-500">Belum ada unit organisasi.</p>
    <div v-else class="rounded-lg border border-slate-200 bg-white p-4">
      <TreeNode :nodes="tree" />
    </div>
  </section>
</template>
