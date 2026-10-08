<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { assetsApi } from '../api'
import type { AssetCategory, AssetLocation } from '../types'

const categories = ref<AssetCategory[]>([])
const locations = ref<AssetLocation[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const submitting = ref(false)
const categoryForm = reactive({ code: '', name: '' })
const locationForm = reactive({ name: '', address: '' })

async function load() {
  loading.value = true
  error.value = null
  try {
    const [cats, locs] = await Promise.all([assetsApi.categories(), assetsApi.locations()])
    categories.value = cats
    locations.value = locs
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function addCategory() {
  submitting.value = true
  error.value = null
  try {
    await assetsApi.createCategory({ code: categoryForm.code, name: categoryForm.name })
    categoryForm.code = ''
    categoryForm.name = ''
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan kategori'
  } finally {
    submitting.value = false
  }
}

async function addLocation() {
  submitting.value = true
  error.value = null
  try {
    await assetsApi.createLocation({ name: locationForm.name, address: locationForm.address || undefined })
    locationForm.name = ''
    locationForm.address = ''
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan lokasi'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <header class="mb-6">
      <router-link to="/assets" class="text-sm text-brand-600 hover:underline">← Aset</router-link>
      <h1 class="text-xl font-semibold text-slate-900">Kategori &amp; Lokasi</h1>
    </header>

    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Kategori</h2>
        <ul class="mb-3 space-y-1 text-sm">
          <li v-for="c in categories" :key="c.id" class="flex justify-between gap-2">
            <span class="text-slate-900">{{ c.name }}</span>
            <span class="font-mono text-xs text-slate-400">{{ c.code }}</span>
          </li>
          <li v-if="categories.length === 0" class="text-slate-500">Belum ada kategori.</li>
        </ul>
        <form class="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" @submit.prevent="addCategory">
          <input v-model="categoryForm.code" placeholder="Kode" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="categoryForm.name" placeholder="Nama" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" :disabled="submitting" class="rounded border border-slate-300 px-3 py-2 text-sm">Tambah</button>
        </form>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold text-slate-900">Lokasi</h2>
        <ul class="mb-3 space-y-1 text-sm">
          <li v-for="l in locations" :key="l.id" class="rounded border border-slate-100 p-2">
            <span class="text-slate-900">{{ l.name }}</span>
            <span v-if="l.address" class="block text-xs text-slate-500">{{ l.address }}</span>
          </li>
          <li v-if="locations.length === 0" class="text-slate-500">Belum ada lokasi.</li>
        </ul>
        <form class="grid gap-2" @submit.prevent="addLocation">
          <input v-model="locationForm.name" placeholder="Nama lokasi" required class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="locationForm.address" placeholder="Alamat" class="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" :disabled="submitting" class="rounded border border-slate-300 px-3 py-2 text-sm sm:w-fit">Tambah</button>
        </form>
      </div>
    </div>
  </section>
</template>
