<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { usersApi, type ScopeGrant } from '@/modules/users/api'
import type { User } from '@/modules/users/types'

const users = ref<User[]>([])
const units = ref<Unit[]>([])
const scopes = ref<ScopeGrant[]>([])
const selectedUserId = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive({ organization_unit_id: '', include_descendants: true })

const unitName = computed(() => {
  const map = new Map(units.value.map((u) => [u.id, `${u.name} (${u.code})`]))
  return (id: string) => map.get(id) ?? id
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const [userList, unitList] = await Promise.all([
      usersApi.list({ pageSize: 200 }),
      organizationApi.listUnits({ pageSize: 200 }),
    ])
    users.value = userList.data
    units.value = unitList.data
    if (!selectedUserId.value && users.value.length) {
      selectedUserId.value = users.value[0].id
    }
    await loadScopes()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

async function loadScopes() {
  if (!selectedUserId.value) {
    scopes.value = []
    return
  }
  try {
    scopes.value = await usersApi.scopes(selectedUserId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat scope'
    scopes.value = []
  }
}

onMounted(load)

async function onUserChange() {
  await loadScopes()
}

async function addScope() {
  if (!form.organization_unit_id) {
    error.value = 'Pilih unit organisasi.'
    return
  }
  saving.value = true
  error.value = null
  try {
    await usersApi.addScope(selectedUserId.value, form.organization_unit_id, form.include_descendants)
    form.organization_unit_id = ''
    await loadScopes()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menambah scope'
  } finally {
    saving.value = false
  }
}

async function removeScope(unitId: string) {
  saving.value = true
  try {
    await usersApi.removeScope(selectedUserId.value, unitId)
    await loadScopes()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menghapus scope'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6">
      <h1 class="text-xl font-semibold text-slate-900">Organization Scope</h1>
      <p class="text-sm text-slate-500">Batasi akses pengguna ke subtree unit organisasi (plan §20, §43)</p>
    </header>

    <p v-if="error" class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <label class="block text-sm font-medium text-slate-700" for="scope-user">Pengguna</label>
        <select id="scope-user" v-model="selectedUserId" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" @change="onUserChange">
          <option v-for="u in users" :key="u.id" :value="u.id">{{ u.full_name }} — {{ u.email }}</option>
        </select>

        <form class="mt-4 grid gap-2" @submit.prevent="addScope">
          <div>
            <label class="block text-sm font-medium text-slate-700" for="scope-unit">Unit Organisasi</label>
            <select id="scope-unit" v-model="form.organization_unit_id" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">— Pilih unit —</option>
              <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }} ({{ u.code }})</option>
            </select>
          </div>
          <label class="flex items-center gap-2 text-sm text-slate-600">
            <input v-model="form.include_descendants" type="checkbox" /> Sertakan turunan
          </label>
          <button type="submit" :disabled="saving" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:w-fit">
            Tambah Scope
          </button>
        </form>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Scope Aktif ({{ scopes.length }})</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="s in scopes" :key="s.organization_unit_id" class="flex items-center justify-between gap-2">
            <span class="text-slate-900">
              {{ unitName(s.organization_unit_id) }}
              <span v-if="s.include_descendants" class="text-xs text-slate-500">+ turunan</span>
            </span>
            <button type="button" :disabled="saving" class="text-xs text-red-600 hover:underline disabled:opacity-50" @click="removeScope(s.organization_unit_id)">
              Hapus
            </button>
          </li>
          <li v-if="scopes.length === 0" class="text-slate-500">Belum ada scope (akses mengikuti peran saja).</li>
        </ul>
      </div>
    </div>
  </section>
</template>
