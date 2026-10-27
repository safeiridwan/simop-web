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
          start_date: '2026-01-05',
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
  const wrapper = mount(NonPartyPage, { global: { stubs: { PersonPicker: true } } })
  await flushPromises()
  return wrapper
}

describe('NonPartyPage header filters', () => {
  it('uses the shared import panel and formats the start date', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('input[placeholder="Cari nama atau kode"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('05-01-2026')

    const importButton = wrapper.findAll('button').find((b) => b.text() === 'Impor')
    await importButton!.trigger('click')
    expect(wrapper.text()).toContain('Unduh template:')
  })

  it('replaces the checkbox bar with header filters', async () => {
    const wrapper = await mountPage()
    expect(wrapper.findAll('input[type="checkbox"]').length).toBe(0)
    expect(wrapper.find('select[aria-label="Filter jenis"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="Filter status"]').exists()).toBe(true)
    expect(wrapper.find('input[aria-label="Filter tanggal mulai dari"]').exists()).toBe(true)
    expect(wrapper.find('input[aria-label="Filter nama"]').exists()).toBe(true)
  })
})
