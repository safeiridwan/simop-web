import { apiGet, apiGetPage, apiPatch, apiPost } from '@/services/http'
import type {
  Batch,
  BatchDetail,
  CadreHistoryEntry,
  CadreLevel,
  CadreProfile,
  PageMeta,
  Participant,
  Session,
  Training,
  TrainingDetail,
} from './types'

export interface ListCadresQuery {
  search?: string
  levelId?: string
  status?: string
}

export const cadreApi = {
  levels: () => apiGet<CadreLevel[]>('/api/v1/cadre-levels'),

  list: (query: ListCadresQuery = {}) => {
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('page_size', '50')
    if (query.search) params.set('search', query.search)
    if (query.levelId) params.set('level_id', query.levelId)
    if (query.status) params.set('status', query.status)
    return apiGetPage<CadreProfile[], PageMeta>(`/api/v1/cadres?${params.toString()}`)
  },
  get: (id: string) => apiGet<CadreProfile>(`/api/v1/cadres/${id}`),
  create: (input: { person_id: string; level_id: string; started_at?: string; notes?: string }) =>
    apiPost<CadreProfile>('/api/v1/cadres', input),
  history: (id: string) => apiGet<CadreHistoryEntry[]>(`/api/v1/cadres/${id}/history`),
  promote: (id: string, input: { to_level_id: string; effective_date?: string; notes?: string }) =>
    apiPost<CadreProfile>(`/api/v1/cadres/${id}/promotions`, input),
  updateStatus: (id: string, status: string, notes?: string) =>
    apiPatch<CadreProfile>(`/api/v1/cadres/${id}`, { status, notes }),

  listTrainings: () => apiGetPage<Training[], PageMeta>('/api/v1/cadre-trainings?page=1&page_size=50'),
  createTraining: (input: { name: string; description?: string; status?: string }) =>
    apiPost<Training>('/api/v1/cadre-trainings', input),
  getTraining: (id: string) => apiGet<TrainingDetail>(`/api/v1/cadre-trainings/${id}`),
  createBatch: (trainingId: string, input: { name: string; start_date?: string; end_date?: string; location?: string }) =>
    apiPost<Batch>(`/api/v1/cadre-trainings/${trainingId}/batches`, input),

  getBatch: (id: string) => apiGet<BatchDetail>(`/api/v1/cadre-training-batches/${id}`),
  addParticipant: (batchId: string, personId: string) =>
    apiPost<Participant>(`/api/v1/cadre-training-batches/${batchId}/participants`, { person_id: personId }),
  createSession: (batchId: string, input: { session_date?: string; topic?: string; facilitator?: string }) =>
    apiPost<Session>(`/api/v1/cadre-training-batches/${batchId}/sessions`, input),

  updateParticipant: (id: string, status: string) =>
    apiPatch<Participant>(`/api/v1/cadre-training-participants/${id}`, { status }),
  assess: (id: string, input: { score?: number; result: string; notes?: string }) =>
    apiPost(`/api/v1/cadre-training-participants/${id}/assessments`, input),
  issueCertificate: (id: string, certificateNumber: string) =>
    apiPost(`/api/v1/cadre-training-participants/${id}/certificates`, { certificate_number: certificateNumber }),

  recordAttendance: (sessionId: string, participantId: string, status: string) =>
    apiPost(`/api/v1/cadre-training-sessions/${sessionId}/attendance`, { participant_id: participantId, status }),
}
