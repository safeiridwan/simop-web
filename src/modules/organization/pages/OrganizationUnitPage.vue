<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import PersonPicker from '@/components/PersonPicker.vue'
import type { Person } from '@/modules/people/types'
import UnitForm from '../components/UnitForm.vue'
import { organizationApi } from '../api'
import type { CreateUnitInput, Officer, Period, Position, Unit, UnitNode, UnitType } from '../types'

const route = useRoute()
const id = route.params.id as string

const unit = ref<Unit | null>(null)
const types = ref<UnitType[]>([])
const parentOptions = ref<Unit[]>([])
const children = ref<UnitNode[]>([])
const positions = ref<Position[]>([])
const periods = ref<Period[]>([])
const officers = ref<Officer[]>([])

const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)

const positionForm = reactive({ position_name: '', position_code: '', max_members: '' })
const periodForm = reactive({ name: '', start_date: '', end_date: '', status: 'ACTIVE' })
const officerForm = reactive({ position_id: '', period_id: '', start_date: '' })
const selectedPerson = ref<Person | null>(null)

const parentName = computed(() => {
  if (!unit.value?.parent_id) return null
  return parentOptions.value.find((u) => u.id === unit.value?.parent_id)?.name ?? '…'
})

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const [u, listData, typeData, childData, posData, perData, offData] = await Promise.all([
      organizationApi.getUnit(id),
      organizationApi.listUnits({ pageSize: 200 }),
      organizationApi.unitTypes(),
      organizationApi.subtree(id),
      organizationApi.listPositions(id),
      organizationApi.listPeriods(id),
      organizationApi.listOfficers(id),
    ])
    unit.value = u
    parentOptions.value = listData.data
    types.value = typeData
    children.value = childData[0]?.children ?? []
    positions.value = posData
    periods.value = perData
    officers.value = offData
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat unit'
  } finally {
    loading.value = false
  }
}

onMounted(refresh)

async function onUpdateUnit(input: CreateUnitInput) {
  saving.value = true
  error.value = null
  try {
    await organizationApi.updateUnit(id, input)
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan unit'
  } finally {
    saving.value = false
  }
}

async function addPosition() {
  saving.value = true
  try {
    await organizationApi.createPosition(id, {
      position_name: positionForm.position_name,
      position_code: positionForm.position_code,
      max_members: positionForm.max_members ? Number(positionForm.max_members) : undefined,
    })
    positionForm.position_name = ''
    positionForm.position_code = ''
    positionForm.max_members = ''
    positions.value = await organizationApi.listPositions(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menambah jabatan'
  } finally {
    saving.value = false
  }
}

async function addPeriod() {
  saving.value = true
  try {
    await organizationApi.createPeriod(id, {
      name: periodForm.name,
      start_date: periodForm.start_date || undefined,
      end_date: periodForm.end_date || undefined,
      status: periodForm.status,
    })
    periodForm.name = ''
    periodForm.start_date = ''
    periodForm.end_date = ''
    periods.value = await organizationApi.listPeriods(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menambah periode'
  } finally {
    saving.value = false
  }
}

async function addOfficer() {
  if (!selectedPerson.value) {
    error.value = 'Pilih orang terlebih dahulu.'
    return
  }
  saving.value = true
  try {
    await organizationApi.createOfficer({
      organization_unit_id: id,
      person_id: selectedPerson.value.id,
      position_id: officerForm.position_id,
      organization_period_id: officerForm.period_id || undefined,
      start_date: officerForm.start_date || undefined,
    })
    selectedPerson.value = null
    officerForm.position_id = ''
    officerForm.period_id = ''
    officerForm.start_date = ''
    officers.value = await organizationApi.listOfficers(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menambah pengurus'
  } finally {
    saving.value = false
  }
}

async function endOfficer(officerId: string) {
  saving.value = true
  try {
    await organizationApi.endOfficer(officerId)
    officers.value = await organizationApi.listOfficers(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal mengakhiri pengurus'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <template v-else-if="unit">
      <header class="mb-6">
        <router-link to="/organization" class="text-sm text-brand-600 hover:underline">← Struktur</router-link>
        <h1 class="text-xl font-semibold text-slate-900">{{ unit.name }}</h1>
        <p class="font-mono text-xs text-slate-500">{{ unit.code }} · {{ unit.unit_type_code }}</p>
        <p v-if="parentName" class="mt-1 text-sm text-slate-500">Induk: {{ parentName }}</p>
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Ubah Unit</h2>
          <UnitForm
            :types="types"
            :parent-options="parentOptions"
            :initial="{ parent_id: unit.parent_id, unit_type_id: unit.unit_type_id, code: unit.code, name: unit.name, status: unit.status }"
            :submitting="saving"
            lock-type
            submit-label="Simpan Perubahan"
            @submit="onUpdateUnit"
          />
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Sub-Unit</h2>
          <ul v-if="children.length" class="space-y-1 text-sm">
            <li v-for="child in children" :key="child.id">
              <router-link :to="`/organization/units/${child.id}`" class="text-brand-600 hover:underline">
                {{ child.name }}
              </router-link>
              <span class="ml-1 font-mono text-xs text-slate-400">{{ child.code }}</span>
            </li>
          </ul>
          <p v-else class="text-sm text-slate-500">Tidak ada sub-unit.</p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Jabatan</h2>
          <ul class="mb-3 space-y-1 text-sm">
            <li v-for="p in positions" :key="p.id" class="flex justify-between gap-2">
              <span class="text-slate-900">{{ p.position_name }}</span>
              <span class="font-mono text-xs text-slate-400">{{ p.position_code }}</span>
            </li>
            <li v-if="positions.length === 0" class="text-slate-500">Belum ada jabatan.</li>
          </ul>
          <form class="grid gap-2 sm:grid-cols-2" @submit.prevent="addPosition">
            <input v-model="positionForm.position_name" placeholder="Nama jabatan" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="positionForm.position_code" placeholder="Kode" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="positionForm.max_members" type="number" min="0" placeholder="Maks. anggota" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
              Tambah Jabatan
            </button>
          </form>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold text-slate-900">Periode</h2>
          <ul class="mb-3 space-y-1 text-sm">
            <li v-for="p in periods" :key="p.id" class="flex justify-between gap-2">
              <span class="text-slate-900">{{ p.name }}</span>
              <span class="text-xs text-slate-500">{{ p.start_date || '—' }} – {{ p.end_date || '—' }} · {{ p.status }}</span>
            </li>
            <li v-if="periods.length === 0" class="text-slate-500">Belum ada periode.</li>
          </ul>
          <form class="grid gap-2 sm:grid-cols-2" @submit.prevent="addPeriod">
            <input v-model="periodForm.name" placeholder="Nama periode" required class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
            <input v-model="periodForm.start_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <input v-model="periodForm.end_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
            <select v-model="periodForm.status" class="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="PLANNED">Direncanakan</option>
              <option value="ACTIVE">Aktif</option>
              <option value="ENDED">Berakhir</option>
            </select>
            <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
              Tambah Periode
            </button>
          </form>
        </div>
      </div>

      <div class="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Pengurus</h2>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-slate-500">
                <th class="py-2 pr-4">Nama</th>
                <th class="py-2 pr-4">Jabatan</th>
                <th class="py-2 pr-4">Mulai</th>
                <th class="py-2 pr-4">Status</th>
                <th class="py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in officers" :key="o.id" class="border-b border-slate-100">
                <td class="py-2 pr-4 text-slate-900">{{ o.full_name }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ o.position_name }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ o.start_date || '—' }}</td>
                <td class="py-2 pr-4 text-slate-600">{{ o.status }}</td>
                <td class="py-2">
                  <button
                    v-if="o.status !== 'ENDED'"
                    type="button"
                    :disabled="saving"
                    class="text-sm text-red-600 hover:underline disabled:opacity-50"
                    @click="endOfficer(o.id)"
                  >
                    Akhiri
                  </button>
                </td>
              </tr>
              <tr v-if="officers.length === 0">
                <td colspan="5" class="py-2 text-slate-500">Belum ada pengurus.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <form class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="addOfficer">
          <div class="sm:col-span-2 lg:col-span-4">
            <label class="block text-sm font-medium text-slate-700">Orang</label>
            <PersonPicker v-model="selectedPerson" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="o-pos">Jabatan</label>
            <select id="o-pos" v-model="officerForm.position_id" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="" disabled>Pilih jabatan</option>
              <option v-for="p in positions" :key="p.id" :value="p.id">{{ p.position_name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="o-per">Periode</label>
            <select id="o-per" v-model="officerForm.period_id" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">— Tanpa periode —</option>
              <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700" for="o-start">Mulai</label>
            <input id="o-start" v-model="officerForm.start_date" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div class="flex items-end">
            <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
              Tambah Pengurus
            </button>
          </div>
        </form>
      </div>
    </template>
  </section>
</template>
