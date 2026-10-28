import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { isoDate } from '@/utils/date'
import GroupAttendanceSection from './GroupAttendanceSection.vue'
import GroupMutabaahSection from './GroupMutabaahSection.vue'
import { kaderisasiApi } from '../api'

vi.mock('../api', () => ({
  kaderisasiApi: {
    groupAttendanceSummary: vi.fn(),
    groupMutabaahSummary: vi.fn(),
  },
}))

const attendanceApi = vi.mocked(kaderisasiApi.groupAttendanceSummary)
const mutabaahApi = vi.mocked(kaderisasiApi.groupMutabaahSummary)

const period = { from: `${new Date().getFullYear()}-01-01`, to: isoDate(), timezone: 'Asia/Makassar' }

afterEach(() => {
  vi.clearAllMocks()
})

describe('GroupAttendanceSection', () => {
  it('loads the default period and shows the empty state', async () => {
    attendanceApi.mockResolvedValue({
      group_id: 'g1',
      period,
      sessions: [],
      members: [],
      summary: { average_percentage: 0, meeting_count: 0 },
    })

    const wrapper = mount(GroupAttendanceSection, { props: { groupId: 'g1' } })
    await flushPromises()

    expect(attendanceApi).toHaveBeenCalledWith('g1', period.from, period.to)
    expect(wrapper.text()).toContain('Belum ada data kehadiran pada periode ini')
  })

  it('shows a retry action when loading fails', async () => {
    attendanceApi.mockRejectedValueOnce(new Error('jaringan'))

    const wrapper = mount(GroupAttendanceSection, { props: { groupId: 'g1' } })
    await flushPromises()
    expect(wrapper.text()).toContain('Data gagal dimuat')

    attendanceApi.mockResolvedValueOnce({
      group_id: 'g1',
      period,
      sessions: [],
      members: [],
      summary: { average_percentage: 0, meeting_count: 0 },
    })
    const retry = wrapper.findAll('button').find((node) => node.text() === 'Coba lagi')
    await retry!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Data gagal dimuat')
    expect(wrapper.text()).toContain('Belum ada data kehadiran pada periode ini')
  })
})

describe('GroupAttendanceSection matrix', () => {
  it('marks an attended session before the join date as present', async () => {
    attendanceApi.mockResolvedValue({
      group_id: 'g1',
      period,
      sessions: [
        { id: 's0', session_date: '2026-01-05', material: 'Dakwah Awal' },
        { id: 's1', session_date: '2026-01-10', material: 'Dakwah Aku' },
        { id: 's2', session_date: '2026-02-10', material: 'Dakwah Mereka' },
        { id: 's3', session_date: '2026-03-10', material: 'Dakwah Kami' },
      ],
      members: [
        {
          member_id: 'm1',
          cadre_profile_id: 'c1',
          full_name: 'DR. Muhammad Yusuf Ali',
          person_code: 'PSN-000015',
          joined_at: '2026-03-01',
          attended: 2,
          total_meetings: 3,
          percentage: 66.7,
          attended_session_ids: ['s1', 's2'],
        },
      ],
      summary: { average_percentage: 66.7, meeting_count: 4 },
    })

    const wrapper = mount(GroupAttendanceSection, { props: { groupId: 'g1' } })
    await flushPromises()

    expect(wrapper.findAll('[title="Hadir"]')).toHaveLength(2)
    expect(wrapper.findAll('[title="Belum bergabung"]')).toHaveLength(1)
    expect(wrapper.findAll('[title="Tidak hadir"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('66.7%')
  })
})

describe('GroupMutabaahSection', () => {
  it('shows the empty state when the group has no reference items', async () => {
    mutabaahApi.mockResolvedValue({
      group_id: 'g1',
      period,
      days: 0,
      items: [],
      members: [],
    })

    const wrapper = mount(GroupMutabaahSection, { props: { groupId: 'g1' } })
    await flushPromises()

    expect(mutabaahApi).toHaveBeenCalledWith('g1', period.from, period.to)
    expect(wrapper.text()).toContain('Ketercapaian per Anggota')
    expect(wrapper.text()).toContain('Belum ada data mutabaah pada periode ini')
  })
})

describe('GroupAttendanceSection monthly checklists', () => {
  const members = [
    {
      member_id: 'm1',
      cadre_profile_id: 'c1',
      full_name: 'Ahmad',
      person_code: 'PSN-000001',
      joined_at: '2026-01-01',
      attended: 2,
      total_meetings: 4,
      percentage: 50,
      attended_session_ids: ['jan1', 'jan2'],
    },
    {
      member_id: 'm2',
      cadre_profile_id: 'c2',
      full_name: 'Budi',
      person_code: 'PSN-000002',
      joined_at: '2026-04-01',
      attended: 0,
      total_meetings: 1,
      percentage: 0,
      attended_session_ids: [],
    },
  ]
  const sessions = [
    { id: 'jan1', session_date: '2026-01-05', material: '' },
    { id: 'jan2', session_date: '2026-01-31', material: '' },
    { id: 'feb1', session_date: '2026-02-01', material: '' },
    { id: 'apr1', session_date: '2026-04-10', material: '' },
  ]

  function payload() {
    return {
      group_id: 'g1',
      period,
      sessions,
      members,
      summary: { average_percentage: 25, meeting_count: 4 },
    }
  }

  async function mountSection() {
    attendanceApi.mockResolvedValue(payload())
    const wrapper = mount(GroupAttendanceSection, { props: { groupId: 'g1' } })
    await flushPromises()
    return wrapper
  }

  it('removes session-date columns from the summary table', async () => {
    const wrapper = await mountSection()
    const summary = wrapper.findAll('table')[0]

    const headers = summary.findAll('th').map((node) => node.text())
    expect(headers).toEqual(['Nama Anggota', 'Hadir', 'Total Pertemuan', 'Persentase Kehadiran'])
    expect(summary.text()).not.toContain('05-01-2026')
    expect(summary.text()).toContain('50.0%')
  })

  it('lists only months with meetings, newest first, labels in Indonesian', async () => {
    const wrapper = await mountSection()
    const buttons = wrapper.findAll('button[aria-expanded]')

    expect(
      buttons.map((node) => node.find('span').text().replace(/[▾▸]/g, '').trim()),
    ).toEqual(['April 2026', 'Februari 2026', 'Januari 2026'])
  })

  it('opens the newest month by default and toggles a month', async () => {
    const wrapper = await mountSection()
    const buttons = wrapper.findAll('button[aria-expanded]')

    expect(buttons.map((node) => node.attributes('aria-expanded'))).toEqual(['true', 'false', 'false'])

    await buttons[2].trigger('click')
    expect(buttons[2].attributes('aria-expanded')).toBe('true')
    expect(buttons[0].attributes('aria-expanded')).toBe('true')
  })

  it('wires aria-controls to an existing panel', async () => {
    const wrapper = await mountSection()
    const button = wrapper.find('button[aria-expanded]')
    const id = button.attributes('aria-controls')!

    expect(id).toBeTruthy()
    expect(wrapper.find(`#${id}`).exists()).toBe(true)
  })

  it('keeps member order identical across month tables and the summary', async () => {
    const wrapper = await mountSection()
    const tables = wrapper.findAll('table').slice(1)

    const names = tables.map((table) =>
      table.findAll('tbody tr').map((row) => row.find('td').text()),
    )
    expect(names).toEqual([
      ['PSN-000001 - Ahmad', 'PSN-000002 - Budi'],
      ['PSN-000001 - Ahmad', 'PSN-000002 - Budi'],
      ['PSN-000001 - Ahmad', 'PSN-000002 - Budi'],
    ])
  })

  it('renders each month with only its own dates, ascending', async () => {
    const wrapper = await mountSection()
    const tables = wrapper.findAll('table').slice(1)

    const dates = tables.map((table) => table.findAll('thead th').slice(1).map((th) => th.text()))
    expect(dates).toEqual([['10-04-2026'], ['01-02-2026'], ['05-01-2026', '31-01-2026']])
  })

  it('shows present, absent, and not-applicable markers with alt text', async () => {
    const wrapper = await mountSection()
    const january = wrapper.findAll('table')[3]

    expect(january.findAll('[title="Hadir"]')).toHaveLength(2)
    expect(january.findAll('[title="Belum bergabung"]')).toHaveLength(2)
    expect(january.findAll('[title="Tidak hadir"]')).toHaveLength(0)

    const april = wrapper.findAll('table')[1]
    expect(april.findAll('[title="Tidak hadir"]')).toHaveLength(2)
  })

  it('keeps the member name column sticky', async () => {
    const wrapper = await mountSection()
    const table = wrapper.findAll('table')[1]

    expect(table.find('thead th').classes()).toContain('sticky')
    expect(table.find('tbody td').classes()).toContain('sticky')
  })

  it('reloads and regroups when the period changes', async () => {
    attendanceApi.mockResolvedValue(payload())
    const wrapper = mount(GroupAttendanceSection, { props: { groupId: 'g1' } })
    await flushPromises()

    const inputs = wrapper.findAll('input[type="date"]')
    await inputs[0].setValue('2025-06-01')
    await inputs[1].setValue('2025-06-30')
    await flushPromises()

    expect(attendanceApi).toHaveBeenLastCalledWith('g1', '2025-06-01', '2025-06-30')
  })

  it('shows the skeleton while loading', () => {
    attendanceApi.mockResolvedValue(payload())
    const wrapper = mount(GroupAttendanceSection, { props: { groupId: 'g1' } })

    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })
})
