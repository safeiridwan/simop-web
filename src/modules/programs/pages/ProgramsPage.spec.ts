import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ProgramsPage from './ProgramsPage.vue'

vi.mock('@/modules/organization/api', () => ({
  organizationApi: { listUnits: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, page_size: 200, total: 0 } }) },
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
          program_type: null,
          start_date: null,
          end_date: null,
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
  it('renders the nine program columns with empty amounts as a dash', async () => {
    const wrapper = mount(ProgramsPage, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    const headers = wrapper.findAll('thead th').map((th) => th.text())
    expect(headers).toEqual([
      'Kode',
      'Nama',
      'Unit',
      'Rencana Anggaran',
      'Proposal',
      'Komitmen Anggaran',
      'LPJ',
      'Realisasi',
      'Status',
    ])

    const cells = wrapper.findAll('tbody tr')[0].findAll('td').map((td) => td.text())
    expect(cells[3]).toBe('-')
    expect(cells[5]).toBe('2.000.000')
    expect(cells[7]).toBe('1.500.000')
  })
})
