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
      { cadre_profile_id: 'c1', person_code: 'PSN-1', full_name: 'Budi', level_code: 'MULA', level_name: 'Mula' },
      { cadre_profile_id: 'c2', person_code: 'PSN-2', full_name: 'Sari', level_code: 'MUDA', level_name: 'Muda' },
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
    expect(cells[2]).toContain('2 orang')
  })

  it('expands the attendee list on click', async () => {
    const wrapper = mount(GroupHistoryPage, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('button[aria-expanded="false"]').trigger('click')
    expect(wrapper.text()).toContain('PSN-1 - Budi')
  })
})
