const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const AUTH_PATHS = new Set(['/api/v1/auth/login', '/api/v1/auth/refresh'])

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

let accessToken: string | null = null
let refreshing: Promise<boolean> | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

interface Envelope<T, M> {
  data: T
  meta?: M
}

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

/** Attempt a single refresh; concurrent callers share the in-flight promise. */
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshing) {
    refreshing = send('POST', '/api/v1/auth/refresh')
      .then(async (res) => {
        if (!res.ok) return false
        const payload = (await res.json()) as Envelope<{ access_token: string }, unknown>
        accessToken = payload.data.access_token
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

async function request<T, M = unknown>(method: string, path: string, body?: unknown): Promise<Envelope<T, M>> {
  let res = await send(method, path, body)

  if (res.status === 401 && !AUTH_PATHS.has(path)) {
    if (await refreshAccessToken()) {
      res = await send(method, path, body)
    }
  }

  const payload = (await res.json().catch(() => ({}))) as Envelope<T, M> & {
    error?: { code?: string; message?: string }
  }

  if (!res.ok) {
    throw new HttpError(res.status, payload.error?.code ?? 'UNKNOWN', payload.error?.message ?? 'Request failed')
  }
  return payload
}

/** GET an endpoint and unwrap `data`. */
export async function apiGet<T>(path: string): Promise<T> {
  return (await request<T>('GET', path)).data
}

/** GET a paginated endpoint, returning `data` and `meta`. */
export async function apiGetPage<T, M = Record<string, unknown>>(path: string): Promise<{ data: T; meta?: M }> {
  const { data, meta } = await request<T, M>('GET', path)
  return { data, meta }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return (await request<T>('POST', path, body)).data
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return (await request<T>('PATCH', path, body)).data
}

export async function apiDelete<T>(path: string): Promise<T> {
  return (await request<T>('DELETE', path)).data
}

/** Internal: used by tests to reset module state. */
export function __resetHttpState(): void {
  accessToken = null
  refreshing = null
}
