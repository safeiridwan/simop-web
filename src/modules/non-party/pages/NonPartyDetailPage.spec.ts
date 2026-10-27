import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import NonPartyDetailPage from './NonPartyDetailPage.vue'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

const people = vi.hoisted(() => ({
  get: vi.fn(),
  listAddresses: vi.fn(),
  listDocuments: vi.fn(),
  update: vi.fn(),
  addDocument: vi.fn(),
  deleteDocument: vi.fn(),
}))

vi.mock('../api', () => ({ affiliationsApi: api }))
vi.mock('@/modules/people/api', () => ({
  peopleApi: people,
  regionsApi: {
    provinces: vi.fn().mockResolvedValue([]),
    cities: vi.fn().mockResolvedValue([]),
    districts: vi.fn().mockResolvedValue([]),
    villages: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock('@/modules/documents/api', () => ({ documentsApi: { upload: vi.fn() } }))
vi.mock('@/app/stores/auth', () => ({ useAuthStore: () => ({ can: () => true }) }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'a1' } }),
  useRouter: () => ({ push: vi.fn() }),
  onBeforeRouteLeave: vi.fn(),
}))

const affiliation = {
  id: 'a1',
  person_id: 'p1',
  person_code: 'PSN-1',
  full_name: 'Budi',
  affiliation_type: 'VOLUNTEER',
  end_date: '2026-12-31',
  status: 'ACTIVE',
  source: 'Kegiatan',
  notes: null,
  city_name: null,
  district_name: null,
  village_name: null,
  created_at: '',
}

function prime() {
  api.get.mockResolvedValue(affiliation)
  people.get.mockResolvedValue({
    id: 'p1',
    person_code: 'PSN-1',
    full_name: 'Budi',
    nik_masked: '3273********0001',
    gender: 'MALE',
    birth_place: 'Maros',
    birth_date: '1990-01-01',
    phone_masked: '0812******',
    email: 'budi@example.com',
    status: 'ACTIVE',
    city_name: null,
    district_name: null,
    village_name: null,
    created_at: '',
    updated_at: '',
  })
  people.listAddresses.mockResolvedValue([])
  people.listDocuments.mockResolvedValue([])
}

function mountPage() {
  return mount(NonPartyDetailPage, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, Teleport: true } },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  prime()
})

describe('NonPartyDetailPage', () => {
  it('renders the breadcrumb, identity section, and no Mulai field', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('nav[aria-label="Breadcrumb"]').text()).toContain('Non-Kader')
    expect(wrapper.find('nav[aria-label="Breadcrumb"]').text()).toContain('Detail Non-Kader')
    expect(wrapper.text()).toContain('Detail Identitas')
    expect(wrapper.text()).toContain('Data Non-Kader')
    expect(wrapper.text()).toContain('31-12-2026')
    expect(wrapper.text()).not.toContain('Mulai')
  })

  it('edits identity and menu fields in one affiliation update', async () => {
    api.update.mockResolvedValue(affiliation)
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findAll('button').find((b) => b.text() === 'Edit')!.trigger('click')
    await wrapper.find('#np-source').setValue('Rekrutmen')
    await wrapper.find('#np-end').setValue('2027-01-31')
    await wrapper.findAll('button').find((b) => b.text() === 'Simpan')!.trigger('click')
    await flushPromises()

    expect(api.update).toHaveBeenCalledTimes(1)
    const [id, payload] = api.update.mock.calls[0]
    expect(id).toBe('a1')
    expect(payload.person).toBeTruthy()
    expect(payload.person.full_name).toBe('Budi')
    expect(payload).not.toHaveProperty('start_date')
    expect(payload.end_date).toBe('2027-01-31')
    expect(people.update).not.toHaveBeenCalled()
  })

  it('warns about the missing required field', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await wrapper.findAll('button').find((b) => b.text() === 'Edit')!.trigger('click')
    await wrapper.find('#pi-name').setValue('   ')
    await wrapper.findAll('button').find((b) => b.text() === 'Simpan')!.trigger('click')

    expect(wrapper.text()).toContain('Nama Lengkap wajib diisi.')
    expect(api.update).not.toHaveBeenCalled()
  })

  it('shows the friendly reason when delete is refused', async () => {
    api.remove.mockRejectedValue(new Error('Data non-kader gagal dihapus.'))
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findAll('button').find((b) => b.text() === 'Hapus')!.trigger('click')
    await wrapper.findAll('button').find((b) => b.text() === 'Ya, Hapus')!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Data non-kader gagal dihapus.')
  })
})
