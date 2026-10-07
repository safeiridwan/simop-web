<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { usePeople } from '../composables/usePeople'

const { people, meta, loading, error, load } = usePeople()

const search = ref('')
const status = ref('')

onMounted(() => void load())

function onFilter() {
  void load(search.value, status.value)
}
</script>

<template>
  <section>
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Orang</h1>
        <p v-if="meta" class="text-sm text-slate-500">{{ meta.total }} data</p>
      </div>
      <router-link
        to="/people/new"
        class="rounded bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
      >
        Tambah Orang
      </router-link>
    </header>

    <div class="mb-4 flex flex-wrap gap-2">
      <input
        v-model="search"
        placeholder="Cari nama atau kode"
        class="w-64 rounded border border-slate-300 px-3 py-2 text-sm"
        @keyup.enter="onFilter"
      />
      <select v-model="status" class="rounded border border-slate-300 px-3 py-2 text-sm" @change="onFilter">
        <option value="">Semua status</option>
        <option value="ACTIVE">Aktif</option>
        <option value="INACTIVE">Tidak aktif</option>
        <option value="DECEASED">Meninggal</option>
      </select>
      <button type="button" class="rounded border border-slate-300 px-3 py-2 text-sm" @click="onFilter">Cari</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="people.length === 0" class="text-sm text-slate-500">Belum ada data orang.</p>

    <table v-else class="w-full border-collapse text-sm">
      <thead>
        <tr class="border-b border-slate-200 text-left text-slate-500">
          <th class="py-2">Kode</th>
          <th class="py-2">Nama</th>
          <th class="py-2">NIK</th>
          <th class="py-2">Telepon</th>
          <th class="py-2">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="person in people" :key="person.id" class="border-b border-slate-100 hover:bg-slate-50">
          <td class="py-2 font-mono text-xs text-slate-500">{{ person.person_code }}</td>
          <td class="py-2">
            <router-link :to="`/people/${person.id}`" class="text-brand-600 hover:underline">
              {{ person.full_name }}
            </router-link>
          </td>
          <td class="py-2 text-slate-600">{{ person.nik_masked || '—' }}</td>
          <td class="py-2 text-slate-600">{{ person.phone_masked || '—' }}</td>
          <td class="py-2 text-slate-600">{{ person.status }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
