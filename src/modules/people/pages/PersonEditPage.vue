<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PersonForm from '../components/PersonForm.vue'
import { peopleApi } from '../api'
import type { Person, PersonInput } from '../types'

const route = useRoute()
const router = useRouter()
const person = ref<Person | null>(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)

const id = route.params.id as string

onMounted(async () => {
  try {
    person.value = await peopleApi.get(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat data'
  } finally {
    loading.value = false
  }
})

async function onSubmit(input: PersonInput) {
  submitting.value = true
  error.value = null
  try {
    await peopleApi.update(id, input)
    await router.push(`/people/${id}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="max-w-2xl">
    <h1 class="mb-6 text-xl font-semibold text-slate-900">Ubah Orang</h1>
    <p v-if="error" class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="loading" class="text-sm text-slate-500">Memuat...</p>
    <PersonForm
      v-else-if="person"
      :initial="{ full_name: person.full_name, gender: person.gender, birth_place: person.birth_place, birth_date: person.birth_date ?? '', email: person.email, status: person.status }"
      submit-label="Simpan Perubahan"
      :submitting="submitting"
      @submit="onSubmit"
    />
    <p class="mt-3 text-xs text-slate-400">Kosongkan NIK bila tidak ingin mengubahnya.</p>
  </section>
</template>
