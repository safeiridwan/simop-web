import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Pagination from './Pagination.vue'

const buttons = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('button')

describe('Pagination', () => {
  it('emits the next page and disables at the last page', async () => {
    const wrapper = mount(Pagination, { props: { meta: { page: 1, page_size: 20, total: 45 } } })

    expect(wrapper.text()).toContain('Hal. 1 dari 3')
    expect(buttons(wrapper)[0].attributes('disabled')).toBeDefined()

    await buttons(wrapper)[1].trigger('click')
    expect(wrapper.emitted('change')).toEqual([[2]])
  })

  it('does not emit past the bounds', async () => {
    const wrapper = mount(Pagination, { props: { meta: { page: 3, page_size: 20, total: 45 } } })

    await buttons(wrapper)[1].trigger('click')
    expect(wrapper.emitted('change')).toBeUndefined()
  })
})
