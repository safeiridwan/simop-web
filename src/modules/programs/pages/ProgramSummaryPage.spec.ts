import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ProgramSummaryPage from './ProgramSummaryPage.vue'

const summary = vi.hoisted(() => ({
  year: 2026,
  type_composition: [
    { type: 'PRIORITAS', label: 'Prioritas', count: 2, percentage: 66.7 },
    { type: 'INISIATIF', label: 'Inisiatif', count: 1, percentage: 33.3 },
  ],
  monthly: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: i === 0 ? 3 : 0 })),
  grand_total: 3000000,
  totals_by_type: [{ type: 'PRIORITAS', label: 'Prioritas', total: 3000000 }],
  totals_by_unit: [{ organization_unit_id: 'u1', organization_unit_name: 'Sekretariat', total: 3000000 }],
}))

vi.mock('../api', () => ({
  programsApi: { summary: vi.fn().mockResolvedValue(summary) },
}))

describe('ProgramSummaryPage', () => {
  it('renders the grand total and per-unit totals in rupiah', async () => {
    const wrapper = mount(ProgramSummaryPage, { global: { stubs: { PieChart: true, BarChart: true } } })
    await flushPromises()

    expect(wrapper.text()).toContain('Rp 3.000.000')
    expect(wrapper.text()).toContain('Sekretariat')
    expect(wrapper.text()).toContain('Prioritas (selesai)')
  })
})
