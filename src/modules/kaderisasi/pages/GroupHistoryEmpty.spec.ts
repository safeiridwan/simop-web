import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import GroupHistoryPage from './GroupHistoryPage.vue'

vi.mock('../api', () => ({
  kaderisasiApi: {
    listSessions: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, page_size: 10, total: 0 } }),
  },
}))
vi.mock('vue-router', () => ({ useRoute: () => ({ params: { id: 'g1' } }) }))

describe('GroupHistoryPage empty state', () => {
  it('shows a clear empty message', async () => {
    const wrapper = mount(GroupHistoryPage, { global: { stubs: { RouterLink: true } } })
    await flushPromises()
    expect(wrapper.text()).toContain('Belum ada riwayat pelaksanaan pembinaan untuk grup ini.')
  })
})
