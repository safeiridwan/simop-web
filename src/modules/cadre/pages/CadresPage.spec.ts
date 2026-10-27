import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import CadresPage from './CadresPage.vue'

vi.mock('../api', () => ({
  cadreApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'c1',
          person_id: 'p1',
          person_code: 'PSN-1',
          full_name: 'Budi',
          level_code: 'MULA',
          level_name: 'Mula',
          status: 'ACTIVE',
          started_at: null,
          notes: null,
          city_name: 'Maros',
          district_name: 'Turikale',
          village_name: 'Pettuadae',
          created_at: '',
        },
      ],
      meta: { page: 1, page_size: 10, total: 1 },
    }),
    levels: vi.fn().mockResolvedValue([{ id: 'l1', code: 'MULA', name: 'Mula', rank_order: 1 }]),
    import: vi.fn(),
  },
}))

async function mountPage() {
  const wrapper = mount(CadresPage, { global: { stubs: { RouterLink: true, PersonPicker: true } } })
  await flushPromises()
  return wrapper
}

describe('CadresPage header filters', () => {
  it('uses the shared import panel', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('input[placeholder="Cari nama atau kode"]').exists()).toBe(false)

    const importButton = wrapper.findAll('button').find((b) => b.text() === 'Impor')
    await importButton!.trigger('click')
    expect(wrapper.text()).toContain('Unduh template:')
  })

  it('renders text, level, and status header filters', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('input[aria-label="Filter nama"]').exists()).toBe(true)
    expect(wrapper.find('input[aria-label="Filter kode"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="Filter jenjang"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="Filter status"]').exists()).toBe(true)
  })
})
