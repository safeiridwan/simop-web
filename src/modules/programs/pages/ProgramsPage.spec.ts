import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ProgramsPage from './ProgramsPage.vue'

vi.mock('@/modules/organization/api', () => ({
  organizationApi: {
    listUnits: vi.fn().mockResolvedValue({
      data: [{ id: 'u1', name: 'DPC Maros', code: 'DPC-MAROS' }],
      meta: { page: 1, page_size: 200, total: 1 },
    }),
  },
}))

vi.mock('../api', () => ({
  programsApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'p1',
          organization_unit_id: 'u1',
          organization_unit_name: 'DPC Maros',
          program_code: 'PRG-000001',
          name: 'Pelatihan',
          description: null,
          objective: 'Tujuan',
          program_type: 'PRIORITAS',
          start_date: '2026-01-01',
          end_date: '2026-01-01',
          activity_date: null,
          location: null,
          person_in_charge_id: null,
          requested_amount: 2000000,
          planned_amount: null,
          approved_amount: null,
          proposal_file_id: null,
          proposal_file_name: null,
          lpj_file_id: null,
          lpj_file_name: null,
          actual_amount: 1500000,
          status: 'DRAFT',
          approved_at: null,
          created_at: '',
          updated_at: '',
        },
      ],
      meta: { page: 1, page_size: 10, total: 1 },
    }),
    create: vi.fn(),
    import: vi.fn(),
  },
}))

describe('ProgramsPage', () => {
  it('renders the ten program columns with rupiah amounts and a single date', async () => {
    const wrapper = mount(ProgramsPage, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    const headers = wrapper.findAll('thead tr')[0].findAll('th').map((th) => th.text())
    expect(headers).toEqual([
      'Kode',
      'Nama',
      'Unit',
      'Tanggal Pelaksanaan',
      'Rencana Anggaran',
      'Proposal',
      'Komitmen Anggaran',
      'LPJ',
      'Realisasi Anggaran',
      'Status',
    ])

    const cells = wrapper.findAll('tbody tr')[0].findAll('td').map((td) => td.text())
    expect(cells[3]).toBe('01-01-2026')
    expect(cells[4]).toBe('-')
    expect(cells[6]).toBe('Rp 2.000.000')
    expect(cells[8]).toBe('Rp 1.500.000')
  })

  it('renders the filter row with name, unit, date range, and status inputs', async () => {
    const wrapper = mount(ProgramsPage, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.find('input[aria-label="Filter nama"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="Filter unit"]').exists()).toBe(true)
    expect(wrapper.find('input[aria-label="Filter tanggal mulai"]').exists()).toBe(true)
    expect(wrapper.find('input[aria-label="Filter tanggal akhir"]').exists()).toBe(true)
    expect(wrapper.find('select[aria-label="Filter status"]').exists()).toBe(true)
    // The old free-text search box is gone.
    expect(wrapper.find('input[placeholder="Cari nama atau kode"]').exists()).toBe(false)
  })
})
