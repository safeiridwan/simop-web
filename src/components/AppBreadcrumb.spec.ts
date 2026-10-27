import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppBreadcrumb from './AppBreadcrumb.vue'

describe('AppBreadcrumb', () => {
  it('renders Menu / Detail Menu with only the first segment as a link', () => {
    const wrapper = mount(AppBreadcrumb, {
      props: { items: [{ label: 'Kader', to: '/cadres' }, { label: 'Detail Kader' }] },
      global: { stubs: { RouterLink: { props: ['to'], template: '<a :data-to="to"><slot /></a>' } } },
    })

    expect(wrapper.text()).toContain('Kader')
    expect(wrapper.text()).toContain('/')
    expect(wrapper.text()).toContain('Detail Kader')

    const links = wrapper.findAll('a')
    expect(links).toHaveLength(1)
    expect(links[0].attributes('data-to')).toBe('/cadres')

    const current = wrapper.find('[aria-current="page"]')
    expect(current.exists()).toBe(true)
    expect(current.text()).toBe('Detail Kader')
    expect(current.element.tagName.toLowerCase()).not.toBe('a')
  })

  it('marks the last segment as current even with three segments', () => {
    const wrapper = mount(AppBreadcrumb, {
      props: {
        items: [
          { label: 'Grup Pembinaan', to: '/kaderisasi/grup-pembinaan' },
          { label: 'Detail Grup Pembinaan', to: '/kaderisasi/grup-pembinaan/1' },
          { label: 'Riwayat Pembinaan' },
        ],
      },
      global: { stubs: { RouterLink: { props: ['to'], template: '<a :data-to="to"><slot /></a>' } } },
    })

    expect(wrapper.findAll('a')).toHaveLength(2)
    expect(wrapper.find('[aria-current="page"]').text()).toBe('Riwayat Pembinaan')
  })
})
