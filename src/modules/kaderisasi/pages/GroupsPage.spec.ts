import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import GroupsPage from './GroupsPage.vue'

vi.mock('../api', () => ({
  kaderisasiApi: {
    listGroups: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'g1',
          name: 'Grup Al-Fatih',
          murabbi: 'Ustadz Ali',
          murabbi_cadre_profile_id: 'c1',
          level_id: 'l1',
          level_code: 'MULA',
          level_name: 'Mula',
          status: 'ACTIVE',
          formed_at: '2026-01-05',
          member_count: 8,
          created_at: '',
        },
        {
          id: 'g2',
          name: 'Grup Lama',
          murabbi: 'Ustadz Budi',
          murabbi_cadre_profile_id: null,
          level_id: null,
          level_code: null,
          level_name: null,
          status: 'INACTIVE',
          formed_at: null,
          member_count: 0,
          created_at: '',
        },
      ],
      meta: { page: 1, page_size: 10, total: 2 },
    }),
    levels: vi.fn().mockResolvedValue([{ id: 'l1', code: 'MULA', name: 'Mula', rank_order: 1 }]),
    importGroups: vi.fn(),
  },
}))

describe('GroupsPage', () => {
  it('renders the six columns including Tanggal Terbentuk', async () => {
    const wrapper = mount(GroupsPage, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    const headers = wrapper.findAll('thead tr')[0].findAll('th').map((th) => th.text())
    expect(headers).toEqual(['Nama', 'Jenjang', 'Tanggal Terbentuk', 'Jumlah Peserta', 'Murabbi', 'Status'])

    const rows = wrapper.findAll('tbody tr')[0].findAll('td').map((td) => td.text())
    expect(rows[2]).toBe('05-01-2026')
    expect(rows[3]).toBe('8')
  })

  it('shows a dash for legacy groups without a formation date', async () => {
    const wrapper = mount(GroupsPage, { global: { stubs: { RouterLink: true } } })
    await flushPromises()
    const rows = wrapper.findAll('tbody tr')[1].findAll('td').map((td) => td.text())
    expect(rows[2]).toBe('-')
  })

  it('renders the header filter row and no standalone search box', async () => {
    const wrapper = mount(GroupsPage, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.find('input[aria-label="Filter nama"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="Filter jenjang"]').exists()).toBe(true)
    expect(wrapper.find('input[aria-label="Filter tanggal terbentuk dari"]').exists()).toBe(true)
    expect(wrapper.find('input[aria-label="Filter murabbi"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="Filter status"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="Cari nama atau murabbi"]').exists()).toBe(false)
  })
})
