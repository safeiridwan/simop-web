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
