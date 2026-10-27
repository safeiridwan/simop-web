import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import GroupDetailPage from './GroupDetailPage.vue'

const auth = vi.hoisted(() => ({ canUpdate: true }))

vi.mock('../api', () => ({
  kaderisasiApi: {
    getGroup: vi.fn().mockResolvedValue({
      group: {
        id: 'g1',
        name: 'Grup Al-Fatih',
        murabbi: 'Ustadz Ali',
        murabbi_cadre_profile_id: 'c1',
        level_id: 'l1',
        level_code: 'MULA',
        level_name: 'Mula',
        status: 'ACTIVE',
        formed_at: '2026-01-05',
        member_count: 0,
        created_at: '',
      },
      members: [],
    }),
    levels: vi.fn().mockResolvedValue([{ id: 'l1', code: 'MULA', name: 'Mula', rank_order: 1 }]),
    groupAttendanceSummary: vi.fn().mockResolvedValue({
      group_id: 'g1',
      period: { from: '2026-01-01', to: '2026-10-27', timezone: 'Asia/Makassar' },
      sessions: [],
      members: [],
      summary: { average_percentage: 0, meeting_count: 0 },
    }),
    groupMutabaahSummary: vi.fn().mockResolvedValue({
      group_id: 'g1',
      period: { from: '2026-01-01', to: '2026-10-27', timezone: 'Asia/Makassar' },
      days: 0,
      items: [],
      members: [],
    }),
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'g1' } }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/app/stores/auth', () => ({
  useAuthStore: () => ({ can: () => auth.canUpdate }),
}))

async function mountPage() {
  const wrapper = mount(GroupDetailPage, {
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        CadrePicker: true,
        GroupMemberEditor: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('GroupDetailPage sections', () => {
  it('removes the Riwayat button', async () => {
    auth.canUpdate = true
    const wrapper = await mountPage()

    const header = wrapper.find('header')
    expect(header.text()).not.toContain('Riwayat')
    expect(header.find('a[aria-label="Riwayat Pelaksanaan Pembinaan"]').exists()).toBe(false)
  })

  it('renders the four sections in order', async () => {
    auth.canUpdate = true
    const wrapper = await mountPage()

    const headings = wrapper.findAll('h2').map((node) => node.text())
    expect(headings).toEqual([
      'Header',
      'Detail Anggota (0)',
      'Kehadiran Temu Pekanan',
      'Mutabaah Yaumiyah',
    ])
  })

  it('keeps the new read-only sections visible while editing', async () => {
    auth.canUpdate = true
    const wrapper = await mountPage()

    const edit = wrapper.findAll('button').find((node) => node.text() === 'Edit')
    expect(edit).toBeDefined()
    await edit!.trigger('click')
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Kehadiran Temu Pekanan')
    expect(text).toContain('Mutabaah Yaumiyah')
  })
})
