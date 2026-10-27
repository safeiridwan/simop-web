import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CadreDetailPage from './CadreDetailPage.vue'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  levels: vi.fn(),
  history: vi.fn(),
  remove: vi.fn(),
  updateStatus: vi.fn(),
  promote: vi.fn(),
}))

const people = vi.hoisted(() => ({
  get: vi.fn(),
  listAddresses: vi.fn(),
  listDocuments: vi.fn(),
  update: vi.fn(),
  addDocument: vi.fn(),
  deleteDocument: vi.fn(),
}))

vi.mock('../api', () => ({ cadreApi: api }))
vi.mock('@/modules/people/api', () => ({
  peopleApi: people,
  regionsApi: {
    provinces: vi.fn().mockResolvedValue([{ id: 'prov1', code: '1', name: 'Sulawesi Selatan' }]),
    cities: vi.fn().mockResolvedValue([{ id: 'c1', code: '1', name: 'Maros' }]),
    districts: vi.fn().mockResolvedValue([]),
    villages: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock('@/modules/documents/api', () => ({ documentsApi: { upload: vi.fn() } }))
vi.mock('@/app/stores/auth', () => ({ useAuthStore: () => ({ can: () => true }) }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'c1' } }),
  useRouter: () => ({ push: vi.fn() }),
  onBeforeRouteLeave: vi.fn(),
}))

const profile = {
  id: 'c1',
  person_id: 'p1',
  person_code: 'PSN-1',
  full_name: 'Budi',
  current_level_id: 'l1',
  level_code: 'MULA',
  level_name: 'Mula',
  status: 'ACTIVE',
  started_at: null,
  notes: null,
  city_name: null,
  district_name: null,
  village_name: null,
  created_at: '',
}

function prime() {
  api.get.mockResolvedValue(profile)
  api.levels.mockResolvedValue([{ id: 'l1', code: 'MULA', name: 'Mula', rank_order: 1 }])
  api.history.mockResolvedValue([])
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
  people.listAddresses.mockResolvedValue([
    { id: 'a1', person_id: 'p1', address_type: 'DOMICILE', address_line: 'Jl. Merdeka', province_id: null, city_id: null, district_id: null, village_id: null, postal_code: null, is_primary: true },
  ])
  people.listDocuments.mockResolvedValue([])
}

function mountPage() {
  return mount(CadreDetailPage, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, Teleport: true } },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  prime()
})

describe('CadreDetailPage', () => {
  it('shows the breadcrumb and is read-only by default', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('nav[aria-label="Breadcrumb"]').text()).toContain('Kader')
    expect(wrapper.find('nav[aria-label="Breadcrumb"]').text()).toContain('Detail Kader')
    expect(wrapper.text()).toContain('Detail Identitas')
    expect(wrapper.text()).toContain('Promosi Jenjang')
    expect(wrapper.text()).toContain('Riwayat Jenjang')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Edit')).toBe(true)
    expect(wrapper.findAll('button').some((b) => b.text() === 'Hapus')).toBe(true)
    expect(wrapper.find('#pi-name').exists()).toBe(false)
  })

  it('enables the identity fields only after Edit and shows Simpan/Batal', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findAll('button').find((b) => b.text() === 'Edit')!.trigger('click')
    expect(wrapper.find('#pi-name').exists()).toBe(true)
    expect(wrapper.findAll('button').some((b) => b.text() === 'Simpan')).toBe(true)
    expect(wrapper.findAll('button').some((b) => b.text() === 'Edit')).toBe(false)
  })

  it('warns which field is required instead of saving a blank name', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await wrapper.findAll('button').find((b) => b.text() === 'Edit')!.trigger('click')
    await wrapper.find('#pi-name').setValue('   ')
    await wrapper.findAll('button').find((b) => b.text() === 'Simpan')!.trigger('click')

    expect(wrapper.text()).toContain('Nama Lengkap wajib diisi.')
    expect(people.update).not.toHaveBeenCalled()
  })

  it('saves identity without touching the cadre level', async () => {
    people.update.mockResolvedValue({})
    const wrapper = mountPage()
    await flushPromises()
    await wrapper.findAll('button').find((b) => b.text() === 'Edit')!.trigger('click')
    await wrapper.find('#pi-name').setValue('Budi Santoso')
    await wrapper.findAll('button').find((b) => b.text() === 'Simpan')!.trigger('click')
    await flushPromises()

    expect(people.update).toHaveBeenCalledTimes(1)
    const [id, payload] = people.update.mock.calls[0]
    expect(id).toBe('p1')
    expect(payload.full_name).toBe('Budi Santoso')
    expect(payload).not.toHaveProperty('level_id')
    expect(payload).not.toHaveProperty('current_level_id')
  })

  it('shows the friendly reason when delete is refused', async () => {
    api.remove.mockRejectedValue(new Error('Kader tidak dapat dihapus karena masih menjadi Murabbi atau anggota grup pembinaan aktif.'))
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findAll('button').find((b) => b.text() === 'Hapus')!.trigger('click')
    const confirm = wrapper.findAll('button').find((b) => b.text() === 'Ya, Hapus')
    await confirm!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('masih menjadi Murabbi atau anggota grup pembinaan aktif')
  })
})
