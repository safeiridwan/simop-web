import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import PeoplePage from './PeoplePage.vue'

vi.mock('../api', () => ({
  peopleApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'p1',
          person_code: 'PSN-1',
          full_name: 'Budi',
          nik_masked: '',
          gender: 'MALE',
          birth_place: '',
          birth_date: null,
          phone_masked: '',
          email: '',
          status: 'ACTIVE',
          city_name: 'Maros',
          district_name: 'Turikale',
          village_name: 'Pettuadae',
          created_at: '',
          updated_at: '',
        },
      ],
      meta: { page: 1, page_size: 10, total: 1 },
    }),
    importPeople: vi.fn(),
  },
}))

vi.mock('@/app/stores/auth', () => ({ useAuthStore: () => ({ isSuperAdmin: false }) }))

async function mountPage() {
  const wrapper = mount(PeoplePage, { global: { stubs: { RouterLink: true } } })
  await flushPromises()
  return wrapper
}

describe('PeoplePage header filters', () => {
  it('uses the shared import panel instead of the legacy inline form', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('input[placeholder="Cari nama atau kode"]').exists()).toBe(false)

    const importButton = wrapper.findAll('button').find((b) => b.text() === 'Impor')
    await importButton!.trigger('click')
    expect(wrapper.text()).toContain('Unduh template:')
    expect(wrapper.text()).toContain('Tutup Impor')
  })

  it('renders the header filter row for text, region, and status columns', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('input[aria-label="Filter kode"]').exists()).toBe(true)
    expect(wrapper.find('input[aria-label="Filter nama"]').exists()).toBe(true)
    expect(wrapper.find('input[aria-label="Filter kabupaten/kota"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="Filter status"]').exists()).toBe(true)
    expect(wrapper.findAll('thead tr').length).toBe(2)
  })
})
