import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import DashboardPage from './DashboardPage.vue'

const sectionMock = vi.hoisted(() => vi.fn())

vi.mock('../api', () => ({ dashboardApi: { section: sectionMock } }))
vi.mock('@/app/stores/auth', () => ({
  useAuthStore: () => ({ user: { full_name: 'Admin' }, can: () => true }),
}))

const counts = {
  persons: 4,
  active_members: 3,
  active_affiliations: 2,
  active_cadres: 1,
  organization_units: 5,
  programs: 6,
  running_programs: 1,
  activities: 2,
  open_tasks: 0,
  planned_meetings: 1,
  available_assets: 2,
  documents: 9,
}

function answer(overrides: Record<string, unknown> = {}) {
  return (section: string) => {
    const table: Record<string, unknown> = {
      counts,
      cadre_by_level: [{ level_code: 'MULA', level_name: 'Mula', count: 1 }],
      programs_by_status: [{ status: 'DRAFT', count: 6 }],
      finance_totals: { total_debit: 1000, total_credit: 500 },
      ...overrides,
    }
    return Promise.resolve({ [section]: table[section] })
  }
}

function mountPage() {
  return mount(DashboardPage, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, SkeletonBlock: true } },
  })
}

describe('DashboardPage', () => {
  it('renders with null/partial data without crashing', async () => {
    sectionMock.mockImplementation((section: string) =>
      Promise.resolve({ [section]: section === 'counts' ? null : null }),
    )
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Kader per Jenjang')
    expect(wrapper.text()).toContain('Tidak ada data.')
    expect(wrapper.text()).not.toContain('Memuat...')
  })

  it('keeps the layout with zeros and "Tidak ada data" for empty lists', async () => {
    sectionMock.mockImplementation(
      answer({
        counts: Object.fromEntries(Object.keys(counts).map((k) => [k, 0])),
        cadre_by_level: [],
        programs_by_status: [],
        finance_totals: { total_debit: 0, total_credit: 0 },
      }),
    )
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Kader per Jenjang')
    expect(wrapper.text()).toContain('Program per Status')
    expect(wrapper.text()).toContain('Keuangan (Terposting)')
    expect(wrapper.findAll('.text-slate-500').some((n) => n.text() === 'Tidak ada data.')).toBe(true)
    expect(wrapper.text()).not.toContain('NaN')
  })

  it('renders loaded data and formatted totals', async () => {
    sectionMock.mockImplementation(answer())
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Mula')
    expect(wrapper.text()).toContain('DRAFT')
    expect(wrapper.text()).toContain('1.000')
    expect(wrapper.text()).toContain('500')
    expect(wrapper.text()).not.toContain('Data gagal dimuat')
  })

  it('fails one block without emptying the page and retries it', async () => {
    let failLevels = true
    sectionMock.mockImplementation((section: string) => {
      if (section === 'cadre_by_level' && failLevels) return Promise.reject(new Error('jaringan putus'))
      return answer()(section)
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Data gagal dimuat')
    expect(wrapper.text()).toContain('DRAFT')
    expect(wrapper.text()).toContain('1.000')

    failLevels = false
    const retry = wrapper.findAll('button').find((b) => b.text() === 'Coba lagi')
    expect(retry).toBeTruthy()
    await retry!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Data gagal dimuat')
    expect(wrapper.text()).toContain('Mula')
  })
})
