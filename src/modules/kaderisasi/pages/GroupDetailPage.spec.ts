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
  const wrapper = mount(GroupDetailPage, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } })
  await flushPromises()
  return wrapper
}

describe('GroupDetailPage actions', () => {
  it('places Riwayat to the left of Edit with the same icon and label', async () => {
    auth.canUpdate = true
    const wrapper = await mountPage()

    const header = wrapper.find('header')
    const html = header.html()
    expect(html).toContain('Riwayat')
    expect(html.indexOf('Riwayat')).toBeLessThan(html.indexOf('>Edit<'))
    expect(header.find('a[aria-label="Riwayat Pelaksanaan Pembinaan"]').exists()).toBe(true)
  })

  it('keeps Riwayat visible when Edit is not available', async () => {
    auth.canUpdate = false
    const wrapper = await mountPage()

    const header = wrapper.find('header')
    expect(header.find('a[aria-label="Riwayat Pelaksanaan Pembinaan"]').exists()).toBe(true)
    expect(header.text()).not.toContain('Edit')
  })
})
