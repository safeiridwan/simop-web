import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import NonPartyPage from './NonPartyPage.vue'

vi.mock('../api', () => ({
  affiliationsApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'a1',
          person_id: 'p1',
          person_code: 'PSN-1',
          full_name: 'Budi',
          affiliation_type: 'VOLUNTEER',
          end_date: null,
          status: 'ACTIVE',
          source: null,
          notes: null,
          city_name: 'Maros',
          district_name: 'Turikale',
          village_name: 'Pettuadae',
          created_at: '',
        },
      ],
      meta: { page: 1, page_size: 10, total: 1 },
    }),
    import: vi.fn(),
  },
}))

async function mountPage() {
  const wrapper = mount(NonPartyPage, { global: { stubs: { PersonPicker: true, RouterLink: true } } })
  await flushPromises()
  return wrapper
}

describe('NonPartyPage header filters', () => {
  it('uses the shared import panel and no longer shows Mulai', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('input[placeholder="Cari nama atau kode"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Mulai')
    expect(wrapper.text()).not.toContain('05-01-2026')

    const importButton = wrapper.findAll('button').find((b) => b.text() === 'Impor')
    await importButton!.trigger('click')
    expect(wrapper.text()).toContain('Unduh template:')
  })

  it('renders the columns in the required order', async () => {
    const wrapper = await mountPage()
    const headers = wrapper.findAll('thead tr')[0].findAll('th').map((th) => th.text())
    expect(headers).toEqual(['Kode', 'Nama', 'Jenis', 'Kabupaten/Kota', 'Kecamatan', 'Kelurahan', 'Status'])
  })

  it('replaces the checkbox bar with header filters and drops the date filter', async () => {
    const wrapper = await mountPage()
    expect(wrapper.findAll('input[type="checkbox"]').length).toBe(0)
    expect(wrapper.find('select[aria-label="Filter jenis"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="Filter status"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="Filter kabupaten/kota"]').exists()).toBe(true)
    expect(wrapper.find('input[aria-label="Filter tanggal mulai dari"]').exists()).toBe(false)
    expect(wrapper.find('input[aria-label="Filter nama"]').exists()).toBe(true)
  })
})
