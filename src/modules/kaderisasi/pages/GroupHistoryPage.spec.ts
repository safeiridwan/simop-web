import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import GroupHistoryPage from './GroupHistoryPage.vue'

const sessions = vi.hoisted(() => [
  {
    id: 's1',
    session_date: '2026-02-10',
    material: 'Materi pembinaan yang sangat panjang '.repeat(4),
    notes: 'Catatan singkat',
    attendees: [
      { id: 'att1', cadre_profile_id: 'c1', person_code: 'PSN-1', full_name: 'Budi', level_code: 'MULA', level_name: 'Mula' },
      { id: 'att2', cadre_profile_id: 'c2', person_code: 'PSN-2', full_name: 'Sari', level_code: 'MUDA', level_name: 'Muda' },
      { id: 'att3', cadre_profile_id: null, person_code: '', full_name: 'Tidak diketahui', level_code: null, level_name: null },
    ],
  },
])

vi.mock('../api', () => ({
  kaderisasiApi: {
    listSessions: vi.fn().mockResolvedValue({ data: sessions, meta: { page: 1, page_size: 10, total: 1 } }),
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'g1' } }),
}))

describe('GroupHistoryPage', () => {
  it('renders the four history columns with a date and attendee count', async () => {
    const wrapper = mount(GroupHistoryPage, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    const headers = wrapper.findAll('thead th').map((th) => th.text())
    expect(headers).toEqual(['Tanggal Pembinaan', 'Materi', 'Anggota yang Hadir', 'Catatan'])

    const cells = wrapper.findAll('tbody tr')[0].findAll('td').map((td) => td.text())
    expect(cells[0]).toBe('10-02-2026')
    expect(cells[2]).toContain('3 orang')
  })

  it('keeps attendees without a cadre profile (TARBS-only user) visible', async () => {
    const wrapper = mount(GroupHistoryPage, { global: { stubs: { RouterLink: true } } })
    await flushPromises()
    await wrapper.find('button[aria-expanded="false"]').trigger('click')
    expect(wrapper.text()).toContain('Tidak diketahui')
  })

  it('expands the attendee list on click', async () => {
    const wrapper = mount(GroupHistoryPage, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('button[aria-expanded="false"]').trigger('click')
    expect(wrapper.text()).toContain('PSN-1 - Budi')
  })
})
