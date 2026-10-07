<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { useUsers } from '../composables/useUsers'
import type { CreateUserInput, User } from '../types'

const { users, loading, error, load, create } = useUsers()

const search = ref('')
const showForm = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)
const form = reactive<CreateUserInput>({ email: '', password: '', full_name: '', role_codes: [] })
const rolesInput = ref('')

onMounted(() => void load())

function onSearch() {
  void load(search.value)
}

async function submit() {
  submitting.value = true
  formError.value = null
  try {
    form.role_codes = rolesInput.value
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)
    await create({ ...form })
    showForm.value = false
    form.email = ''
    form.password = ''
    form.full_name = ''
    rolesInput.value = ''
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Gagal membuat pengguna'
  } finally {
    submitting.value = false
  }
}

function roleLabel(user: User): string {
  return user.roles.length ? user.roles.join(', ') : '—'
}
</script>

<template>
  <section>
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-900">Pengguna</h1>
      <button
        type="button"
        class="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Batal' : 'Tambah Pengguna' }}
      </button>
    </header>

    <form v-if="showForm" class="mb-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4" @submit.prevent="submit">
      <div>
        <label class="block text-sm font-medium text-slate-700" for="u-name">Nama</label>
        <input id="u-name" v-model="form.full_name" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="u-email">Email</label>
        <input id="u-email" v-model="form.email" type="email" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="u-password">Password</label>
        <input id="u-password" v-model="form.password" type="password" required minlength="8" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="u-roles">Role (pisahkan dengan koma)</label>
        <input id="u-roles" v-model="rolesInput" placeholder="SUPER_ADMIN" class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
      <button
        type="submit"
        :disabled="submitting"
        class="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {{ submitting ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </form>

    <div class="mb-4 flex gap-2">
      <input
        v-model="search"
        placeholder="Cari nama atau email"
        class="w-64 rounded border border-slate-300 px-3 py-2 text-sm"
        @keyup.enter="onSearch"
      />
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onSearch">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="users.length === 0" class="text-sm text-slate-500">Belum ada pengguna.</p>

    <table v-else class="w-full border-collapse text-sm">
      <thead>
        <tr class="border-b border-slate-200 text-left text-slate-500">
          <th class="py-2">Nama</th>
          <th class="py-2">Email</th>
          <th class="py-2">Status</th>
          <th class="py-2">Role</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id" class="border-b border-slate-100">
          <td class="py-2 text-slate-900">{{ user.full_name }}</td>
          <td class="py-2 text-slate-600">{{ user.email }}</td>
          <td class="py-2 text-slate-600">{{ user.status }}</td>
          <td class="py-2 text-slate-600">{{ roleLabel(user) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
