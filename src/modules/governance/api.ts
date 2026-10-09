import { apiGet, apiGetPage, apiPatch, apiPost } from '@/services/http'
import type { ActionItem, Meeting, MeetingDetail, PageMeta, Task } from './types'

export const meetingsApi = {
  list: (query: { search?: string; status?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 20) })
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
    return apiGetPage<Meeting[], PageMeta>(`/api/v1/meetings?${params.toString()}`)
  },
  get: (id: string) => apiGet<MeetingDetail>(`/api/v1/meetings/${id}`),
  create: (input: {
    organization_unit_id: string
    title: string
    meeting_type?: string
    start_at?: string
    end_at?: string
    location?: string
  }) => apiPost<Meeting>('/api/v1/meetings', input),
  update: (id: string, input: Partial<Meeting>) => apiPatch<Meeting>(`/api/v1/meetings/${id}`, input),
  addParticipant: (id: string, personId: string, role?: string) =>
    apiPost(`/api/v1/meetings/${id}/participants`, { person_id: personId, role }),
  setAttendance: (id: string, participantId: string, attendance: string) =>
    apiPatch(`/api/v1/meetings/${id}/participants/${participantId}`, { attendance }),
  addAgenda: (id: string, orderNo: number, topic: string) =>
    apiPost(`/api/v1/meetings/${id}/agendas`, { order_no: orderNo, topic }),
  addMinutes: (id: string, content: string) => apiPost(`/api/v1/meetings/${id}/minutes`, { content }),
  addDecision: (id: string, decisionNumber: string, decisionText: string) =>
    apiPost(`/api/v1/meetings/${id}/decisions`, { decision_number: decisionNumber, decision_text: decisionText }),
  addActionItem: (id: string, input: { decision_id?: string; assigned_to?: string; description: string; due_date?: string }) =>
    apiPost<ActionItem>(`/api/v1/meetings/${id}/action-items`, input),
  setActionItemStatus: (id: string, itemId: string, status: string) =>
    apiPatch(`/api/v1/meetings/${id}/action-items/${itemId}`, { status }),
}

export const tasksApi = {
  list: (query: { search?: string; status?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(query.page ?? 1), page_size: String(query.pageSize ?? 20) })
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
    return apiGetPage<Task[], PageMeta>(`/api/v1/tasks?${params.toString()}`)
  },
  get: (id: string) => apiGet<Task>(`/api/v1/tasks/${id}`),
  create: (input: {
    organization_unit_id: string
    title: string
    description?: string
    assigned_to?: string
    due_date?: string
    priority?: string
  }) => apiPost<Task>('/api/v1/tasks', input),
  update: (id: string, input: Record<string, unknown>) => apiPatch<Task>(`/api/v1/tasks/${id}`, input),
  complete: (id: string) => apiPost<Task>(`/api/v1/tasks/${id}/complete`),
}
