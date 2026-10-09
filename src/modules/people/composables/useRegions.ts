import { ref } from 'vue'

import { regionsApi } from '../api'
import type { Region } from '../types'

// ponytail: dedupe by name to hide stale duplicate region seed rows; fix data at source.
function dedupe(regions: Region[]): Region[] {
  const seen = new Set<string>()
  return regions.filter((r) => {
    const key = r.name.trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function useRegions() {
  const provinces = ref<Region[]>([])
  const cities = ref<Region[]>([])
  const districts = ref<Region[]>([])
  const villages = ref<Region[]>([])

  async function loadProvinces(): Promise<void> {
    provinces.value = dedupe(await regionsApi.provinces())
  }

  async function loadCities(provinceId: string): Promise<void> {
    cities.value = provinceId ? dedupe(await regionsApi.cities(provinceId)) : []
    districts.value = []
    villages.value = []
  }

  async function loadDistricts(cityId: string): Promise<void> {
    districts.value = cityId ? dedupe(await regionsApi.districts(cityId)) : []
    villages.value = []
  }

  async function loadVillages(districtId: string): Promise<void> {
    villages.value = districtId ? dedupe(await regionsApi.villages(districtId)) : []
  }

  return { provinces, cities, districts, villages, loadProvinces, loadCities, loadDistricts, loadVillages }
}
