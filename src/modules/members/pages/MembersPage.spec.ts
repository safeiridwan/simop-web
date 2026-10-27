import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import MembersPage from './MembersPage.vue'

vi.mock('../api', () => ({
  membersApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'm1',
          person_id: 'p1',
          person_code: 'PSN-1',
          full_name: 'Budi',
          member_number: 'MBR-1',
          join_date: '2026-01-05',
          status: 'ACTIVE',
          membership_source: null,
          verified_at: null,
          resigned_at: null,
          city_name: 'Maros',
          district_name: 'Turikale',
          village_name: 'Pettuadae',
          created_at: '',
          updated_at: '',
        },
      ],
      meta: { page: 1, page_size: 10, total: 1 },
    }),
    import: vi.fn(),
    exportUrl: vi.fn().mockReturnValue('/api/v1/members/export'),
  },
}))

async function mountPage() {
  const wrapper = mount(MembersPage, { global: { stubs: { RouterLink: true, PersonPicker: true } } })
  await flushPromises()
  return wrapper
}

describe('MembersPage header filters', () => {
  it('uses the shared import panel and formats the join date', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('input[placeholder="Cari nama atau nomor anggota"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('05-01-2026')

    const importButton = wrapper.findAll('button').find((b) => b.text() === 'Impor')
    await importButton!.trigger('click')
    expect(wrapper.text()).toContain('Unduh template:')
  })

  it('renders text, status, and date-range header filters', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('input[aria-label="Filter nomor anggota"]').exists()).toBe(true)
    expect(wrapper.find('input[aria-label="Filter nama"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="Filter status"]').exists()).toBe(true)
    expect(wrapper.find('input[aria-label="Filter tanggal gabung dari"]').exists()).toBe(true)
  })
})
