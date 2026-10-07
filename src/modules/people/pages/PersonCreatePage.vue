<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import PersonForm from '../components/PersonForm.vue'
import { peopleApi } from '../api'
import type { PersonInput } from '../types'

const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)

async function onSubmit(input: PersonInput) {
  submitting.value = true
  error.value = null
  try {
    const person = await peopleApi.create(input)
    await router.push(`/people/${person.id}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menyimpan'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="max-w-2xl">
    <h1 class="mb-6 text-xl font-semibold text-slate-900">Tambah Orang</h1>
    <p v-if="error" class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <PersonForm :submitting="submitting" submit-label="Simpan" duplicate-check @submit="onSubmit" />
  </section>
</template>
