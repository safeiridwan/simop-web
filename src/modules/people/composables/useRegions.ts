import { ref } from 'vue'

import { regionsApi } from '../api'
import type { Region } from '../types'

export function useRegions() {
  const provinces = ref<Region[]>([])
  const cities = ref<Region[]>([])
  const districts = ref<Region[]>([])
  const villages = ref<Region[]>([])

  async function loadProvinces(): Promise<void> {
    provinces.value = await regionsApi.provinces()
  }

  async function loadCities(provinceId: string): Promise<void> {
    cities.value = provinceId ? await regionsApi.cities(provinceId) : []
    districts.value = []
    villages.value = []
  }

  async function loadDistricts(cityId: string): Promise<void> {
    districts.value = cityId ? await regionsApi.districts(cityId) : []
    villages.value = []
  }

  async function loadVillages(districtId: string): Promise<void> {
    villages.value = districtId ? await regionsApi.villages(districtId) : []
  }

  return { provinces, cities, districts, villages, loadProvinces, loadCities, loadDistricts, loadVillages }
}
