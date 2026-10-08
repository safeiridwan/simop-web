<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import PersonPicker from '@/components/PersonPicker.vue'
import type { Person } from '@/modules/people/types'
import { organizationApi } from '@/modules/organization/api'
import type { Unit } from '@/modules/organization/types'
import { useAuthStore } from '@/app/stores/auth'
import { tasksApi } from '../api'
import { ITEM_STATUSES, TASK_PRIORITIES, taskPriorityLabel, type Task } from '../types'

const auth = useAuthStore()
const tasks = ref<Task[]>([])
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const submitting = ref(false)
const selectedPerson = ref<Person | null>(null)

const search = ref('')
const statusFilter = ref('')
const form = reactive({ organization_unit_id: '', title: '', description: '', due_date: '', priority: 'NORMAL' })

async function load() {
  loading.value = true
  error.value = null
  try {
    const [list, unitList] = await Promise.all([
      tasksApi.list({ search: search.value, status: statusFilter.value }),
      organizationApi.listUnits({ pageSize: 200 }),
    ])
    tasks.value = list.data
    units.value = unitList.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat tugas'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function submit() {
  submitting.value = true
  error.value = null
  try {
    await tasksApi.create({
      organization_unit_id: form.organization_unit_id,
      title: form.title,
      description: form.description || undefined,
      assigned_to: selectedPerson.value?.id,
      due_date: form.due_date || undefined,
      priority: form.priority,
    })
    showForm.value = false
    form.title = ''
    form.description = ''
    form.due_date = ''
    form.priority = 'NORMAL'
    selectedPerson.value = null
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan tugas'
  } finally {
    submitting.value = false
  }
}

async function run(fn: () => Promise<unknown>) {
  error.value = null
  try {
    await fn()
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Operasi gagal'
  }
}

function completeTask(id: string) {
  void run(() => tasksApi.complete(id))
}
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Tugas</h1>
        <p class="text-sm text-slate-500">{{ tasks.length }} tugas</p>
      </div>
      <button type="button" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-fit" @click="showForm = !showForm">
        {{ showForm ? 'Batal' : 'Tambah Tugas' }}
      </button>
    </header>

    <div v-if="showForm" class="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
      <select v-model="form.organization_unit_id" required class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option value="" disabled>Unit organisasi</option>
        <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
      <input v-model="form.title" placeholder="Judul tugas" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700">Penanggung jawab</label>
        <PersonPicker v-model="selectedPerson" />
      </div>
      <input v-model="form.due_date" type="date" class="rounded border border-slate-300 px-3 py-2 text-sm" />
      <select v-model="form.priority" class="rounded border border-slate-300 px-3 py-2 text-sm">
        <option v-for="p in TASK_PRIORITIES" :key="p.value" :value="p.value">{{ p.label }}</option>
      </select>
      <input v-model="form.description" placeholder="Deskripsi" class="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
      <button type="button" :disabled="submitting" class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:col-span-2 sm:w-fit" @click="submit">
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <input v-model="search" placeholder="Cari tugas" class="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:w-64" @keyup.enter="load" />
      <select v-model="statusFilter" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="load">
        <option value="">Semua status</option>
        <option v-for="s in ITEM_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="load">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="tasks.length === 0" class="text-sm text-slate-500">Belum ada tugas.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-slate-500">
            <th class="py-2 pr-4">Judul</th>
            <th class="py-2 pr-4">Penanggung jawab</th>
            <th class="py-2 pr-4">Tenggat</th>
            <th class="py-2 pr-4">Prioritas</th>
            <th class="py-2 pr-4">Status</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tasks" :key="t.id" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-4 text-slate-900">{{ t.title }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ t.assignee_name || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ t.due_date || '—' }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ taskPriorityLabel(t.priority) }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ t.status }}</td>
            <td class="py-2">
              <button
                v-if="t.status !== 'DONE' && auth.can('governance:update')"
                type="button"
                class="text-xs text-brand-600 hover:underline"
                @click="completeTask(t.id)"
              >
                Selesaikan
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
