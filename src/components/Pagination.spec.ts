import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Pagination from './Pagination.vue'

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll('button').find((b) => b.text() === text)!

describe('Pagination', () => {
  it('renders page numbers and emits a clicked page', async () => {
    const wrapper = mount(Pagination, { props: { meta: { page: 1, page_size: 20, total: 45 } } })

    expect(wrapper.text()).toContain('Hal. 1 dari 3')
    expect(buttonByText(wrapper, 'Sebelumnya').attributes('disabled')).toBeDefined()

    await buttonByText(wrapper, '3').trigger('click')
    expect(wrapper.emitted('change')).toEqual([[3]])
  })

  it('does not emit past the bounds', async () => {
    const wrapper = mount(Pagination, { props: { meta: { page: 3, page_size: 20, total: 45 } } })

    await buttonByText(wrapper, 'Berikutnya').trigger('click')
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('emits the selected page size', async () => {
    const wrapper = mount(Pagination, { props: { meta: { page: 1, page_size: 20, total: 45 } } })

    await wrapper.find('select').setValue('50')
    expect(wrapper.emitted('page-size-change')).toEqual([[50]])
  })
})
