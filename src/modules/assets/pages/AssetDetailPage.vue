<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import PersonPicker from '@/components/PersonPicker.vue'
import type { Person } from '@/modules/people/types'
import { useAuthStore } from '@/app/stores/auth'
import { assetsApi } from '../api'
import { ASSET_CONDITIONS, MAINTENANCE_STATUSES, assetConditionLabel, assetStatusLabel, type AssetDetail } from '../types'

const route = useRoute()
const auth = useAuthStore()
const id = route.params.id as string

const detail = ref<AssetDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const conditionForm = reactive({ condition: '' })
const selectedPerson = ref<Person | null>(null)
const maintenanceForm = reactive({ maintenance_date: '', description: '', cost: '', status: 'DONE' })
const disposeForm = reactive({ disposal_date: '', reason: '', method: '' })

const canUpdate = computed(() => auth.can('assets:update'))
const isDisposed = computed(() => detail.value?.asset.status === 'DISPOSED')
const activeAssignment = computed(() => detail.value?.assignments.find((a) => !a.returned_at) ?? null)

async function load() {
  loading.value = true
  error.value = null
  try {
    detail.value = await assetsApi.get(id)
    conditionForm.condition = detail.value.asset.condition
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat aset'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function run(fn: () => Promise<unknown>) {
  saving.value = true
  error.value = null
  try {
    await fn()
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Operasi gagal'
  } finally {
    saving.value = false
  }
}

function saveCondition() {
  void run(() => assetsApi.update(id, { condition: conditionForm.condition }))
}

function returnAsset() {
  void run(() => assetsApi.returnAsset(id))
}

function assign() {
  if (!selectedPerson.value) {
    error.value = 'Pilih orang terlebih dahulu.'
    return
  }
  void run(async () => {
    await assetsApi.assign(id, selectedPerson.value!.id)
    selectedPerson.value = null
  })
}

function addMaintenance() {
  void run(async () => {
    await assetsApi.maintenance(id, {
      maintenance_date: maintenanceForm.maintenance_date || undefined,
      description: maintenanceForm.description,
      cost: maintenanceForm.cost ? Number(maintenanceForm.cost) : undefined,
      status: maintenanceForm.status,
    })
    maintenanceForm.description = ''
    maintenanceForm.cost = ''
    maintenanceForm.maintenance_date = ''
  })
}

function dispose() {
  void run(async () => {
    await assetsApi.dispose(id, {
      disposal_date: disposeForm.disposal_date || undefined,
      reason: disposeForm.reason || undefined,
      method: disposeForm.method || undefined,
    })
    disposeForm.reason = ''
    disposeForm.method = ''
  })
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="detail">
      <header class="mb-6">
        <router-link to="/assets" class="text-sm text-brand-600 hover:underline">← Aset</router-link>
        <h1 class="text-xl font-semibold text-slate-900">{{ detail.asset.name }}</h1>
        <p class="font-mono text-xs text-slate-500">{{ detail.asset.asset_code }} · {{ assetStatusLabel(detail.asset.status) }}</p>
      </header>

      <dl class="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div><dt class="text-slate-500">Kategori</dt><dd class="text-slate-900">{{ detail.asset.category_name || '—' }}</dd></div>
        <div><dt class="text-slate-500">Kondisi</dt><dd class="text-slate-900">{{ assetConditionLabel(detail.asset.condition) }}</dd></div>
        <div><dt class="text-slate-500">Perolehan</dt><dd class="text-slate-900">{{ detail.asset.acquisition_date || '—' }}</dd></div>
        <div><dt class="text-slate-500">Nilai</dt><dd class="text-slate-900">{{ detail.asset.acquisition_value ? detail.asset.acquisition_value.toLocaleString('id-ID') : '—' }}</dd></div>
      </dl>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Kondisi &amp; Peminjaman</h2>
          <form v-if="canUpdate" class="flex flex-wrap items-end gap-2" @submit.prevent="saveCondition">
            <select v-model="conditionForm.condition" class="rounded border border-slate-300 px-3 py-2 text-sm">
              <option v-for="c in ASSET_CONDITIONS" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Simpan Kondisi</button>
          </form>

          <div v-if="canUpdate && !isDisposed" class="mt-4 border-t border-slate-100 pt-4">
            <template v-if="!activeAssignment">
              <label class="block text-sm font-medium text-slate-700">Pinjamkan ke</label>
              <div class="mt-1 grid gap-2 sm:grid-cols-[1fr_auto]">
                <PersonPicker v-model="selectedPerson" />
                <button type="button" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50" @click="assign">
                  Pinjamkan
                </button>
              </div>
            </template>
            <template v-else>
              <p class="text-sm text-slate-600">Dipinjam oleh <strong>{{ activeAssignment.person_name || 'unit' }}</strong>.</p>
              <button type="button" :disabled="saving" class="mt-2 rounded border border-slate-300 px-3 py-2 text-sm" @click="returnAsset">
                Kembalikan
              </button>
            </template>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Riwayat Peminjaman</h2>
          <ul class="space-y-2 text-sm">
            <li v-for="a in detail.assignments" :key="a.id" class="rounded border border-slate-100 p-2">
              <span class="text-slate-900">{{ a.person_name || 'Unit' }}</span>
              <span class="block text-xs text-slate-500">
                {{ new Date(a.assigned_at).toLocaleDateString('id-ID') }}
                → {{ a.returned_at ? new Date(a.returned_at).toLocaleDateString('id-ID') : 'aktif' }}
              </span>
            </li>
            <li v-if="detail.assignments.length === 0" class="text-slate-500">Belum ada riwayat.</li>
          </ul>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Pemeliharaan</h2>
          <ul class="mb-3 space-y-2 text-sm">
            <li v-for="m in detail.maintenance" :key="m.id" class="rounded border border-slate-100 p-2 text-slate-700">
              {{ m.description }}
              <span class="block text-xs text-slate-500">{{ m.maintenance_date || '—' }} · {{ m.cost ? m.cost.toLocaleString('id-ID') : '—' }} · {{ m.status }}</span>
            </li>
            <li v-if="detail.maintenance.length === 0" class="text-slate-500">Belum ada pemeliharaan.</li>
          </ul>
          <form v-if="canUpdate && !isDisposed" class="grid gap-2 sm:grid-cols-2" @submit.prevent="addMaintenance">
            <input v-model="maintenanceForm.maintenance_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="maintenanceForm.cost" type="number" step="0.01" placeholder="Biaya" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="maintenanceForm.description" placeholder="Deskripsi" required class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
            <select v-model="maintenanceForm.status" class="rounded border border-slate-300 px-3 py-2 text-sm">
              <option v-for="s in MAINTENANCE_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <button type="submit" :disabled="saving" class="rounded border border-slate-300 px-3 py-2 text-sm">Tambah</button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Penghapusan</h2>
          <ul class="mb-3 space-y-2 text-sm">
            <li v-for="d in detail.disposals" :key="d.id" class="rounded border border-slate-100 p-2 text-slate-700">
              {{ d.reason || '—' }}
              <span class="block text-xs text-slate-500">{{ d.disposal_date || '—' }} · {{ d.method || '—' }}</span>
            </li>
            <li v-if="detail.disposals.length === 0" class="text-slate-500">Belum ada penghapusan.</li>
          </ul>
          <form v-if="canUpdate && !isDisposed" class="grid gap-2 sm:grid-cols-2" @submit.prevent="dispose">
            <input v-model="disposeForm.disposal_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="disposeForm.method" placeholder="Metode" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="disposeForm.reason" placeholder="Alasan" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
            <button type="submit" :disabled="saving" class="rounded border border-red-300 px-3 py-2 text-sm text-red-600 sm:col-span-2 sm:w-fit">
              Hapuskan Aset
            </button>
          </form>
        </div>
      </div>
    </template>
  </section>
</template>
