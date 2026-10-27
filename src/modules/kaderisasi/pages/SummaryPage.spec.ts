import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import SummaryPage from './SummaryPage.vue'

const summary = vi.hoisted(() => ({
  period: {
    month: '2026-10',
    from: '2026-10-01',
    to: '2026-10-26',
    days: 26,
    week_start: '2026-10-26',
    week_end: '2026-11-01',
    timezone: 'Asia/Makassar',
  },
  groups: [
    { level_id: 'l1', code: 'MULA', name: 'Mula', count: 0, percentage: 0 },
    { level_id: 'l2', code: 'MUDA', name: 'Muda', count: 2, percentage: 100 },
  ],
  members: [
    { level_id: 'l1', code: 'MULA', name: 'Mula', count: 0, percentage: 0 },
    { level_id: 'l2', code: 'MUDA', name: 'Muda', count: 4, percentage: 100 },
  ],
  agenda: [
    {
      group_id: 'g1',
      name: 'Grup Al-Fatih',
      murabbi: 'Ustadz Ali',
      level_name: 'Muda',
      last_session_date: '2026-10-26',
      status: 'BERJALAN',
    },
  ],
  mutabaah: [
    {
      rank: 1,
      cadre_profile_id: 'c1',
      full_name: 'Budi',
      level_name: 'Muda',
      group_name: 'Grup Al-Fatih',
      filled_days: 13,
      total_days: 26,
      percentage: 50,
    },
  ],
  attendance: [
    {
      rank: 1,
      cadre_profile_id: 'c1',
      full_name: 'Sari',
      level_name: 'Muda',
      group_name: 'Grup Al-Fatih',
      approved: 3,
      total_meetings: 4,
      percentage: 75,
    },
  ],
}))

const summaryMock = vi.hoisted(() => vi.fn())

vi.mock('../api', () => ({ kaderisasiApi: { summary: summaryMock } }))

const PieStub = {
  name: 'PieChart',
  props: ['labels', 'values', 'disabled', 'emptyLabel', 'ariaLabel'],
  template: '<div class="pie-stub" :data-disabled="String(disabled)" />',
}

function answerWith(overrides: Record<string, unknown> = {}) {
  return (query: { section?: string }) => {
    const payload: Record<string, unknown> = {
      period: summary.period,
      groups_by_level: summary.groups,
      members_by_level: summary.members,
      total_cadres: 32,
      weekly_agenda: { items: summary.agenda, meta: { page: 1, page_size: 10, total: 1 } },
      top_mutabaah: summary.mutabaah,
      top_attendance: summary.attendance,
      ...overrides,
    }
    return Promise.resolve({
      period: payload.period,
      groups_by_level: payload.groups_by_level,
      members_by_level: payload.members_by_level,
      total_cadres: payload.total_cadres,
      weekly_agenda: payload.weekly_agenda,
      top_mutabaah: payload.top_mutabaah,
      top_attendance: payload.top_attendance,
      section: query.section,
    })
  }
}

async function mountPage() {
  return mount(SummaryPage, {
    global: { stubs: { PieChart: PieStub, Pagination: true } },
  })
}

describe('SummaryPage', () => {
  it('renders both pies, the total card, and the three tables', async () => {
    summaryMock.mockImplementation(answerWith())
    const wrapper = await mountPage()
    await flushPromises()

    expect(wrapper.find('.pie-stub').attributes('data-disabled')).toBe('false')
    expect(wrapper.text()).toContain('32')
    expect(wrapper.text()).toContain('Grup Al-Fatih')
    expect(wrapper.text()).toContain('Berjalan')
    expect(wrapper.text()).toContain('50.0% (13/26 hari)')
    expect(wrapper.text()).toContain('75.0% (3/4 pertemuan)')
    expect(wrapper.text()).not.toContain('NaN')
  })

  it('keeps the layout with disabled charts and zero values when data is empty', async () => {
    summaryMock.mockImplementation(
      answerWith({
        groups_by_level: [
          { level_id: 'l1', code: 'MULA', name: 'Mula', count: 0, percentage: 0 },
          { level_id: 'l2', code: 'MUDA', name: 'Muda', count: 0, percentage: 0 },
        ],
        members_by_level: [{ level_id: 'l1', code: 'MULA', name: 'Mula', count: 0, percentage: 0 }],
        total_cadres: 0,
        weekly_agenda: { items: [], meta: { page: 1, page_size: 10, total: 0 } },
        top_mutabaah: [],
        top_attendance: [],
      }),
    )
    const wrapper = await mountPage()
    await flushPromises()

    const pies = wrapper.findAll('.pie-stub')
    expect(pies.length).toBe(2)
    for (const pie of pies) {
      expect(pie.attributes('data-disabled')).toBe('true')
    }
    expect(wrapper.text()).toContain('Mula0 · 0.0%')
    expect(wrapper.text()).toContain('0')
    expect(wrapper.text()).toContain('Belum ada data.')
    expect(wrapper.text()).not.toContain('NaN')
  })

  it('fails each block independently and retries it', async () => {
    let groupsFail = true
    summaryMock.mockImplementation((query: { section?: string }) => {
      if (query.section === 'groups_by_level' && groupsFail) {
        return Promise.reject(new Error('jaringan putus'))
      }
      return answerWith()(query)
    })

    const wrapper = await mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Data kelompok gagal dimuat.')
    expect(wrapper.text()).toContain('Coba lagi')
    // Other blocks still render.
    expect(wrapper.text()).toContain('Grup Al-Fatih')
    expect(wrapper.text()).toContain('32')

    groupsFail = false
    const retry = wrapper.findAll('button').find((button) => button.text() === 'Coba lagi')
    expect(retry).toBeTruthy()
    await retry!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Data kelompok gagal dimuat.')
    expect(wrapper.find('.pie-stub').attributes('data-disabled')).toBe('false')
  })
})
