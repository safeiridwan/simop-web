import { afterEach, describe, expect, it, vi } from 'vitest'

import { HttpError, __resetHttpState, apiGet, setAccessToken } from './http'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('http client', () => {
  afterEach(() => {
    __resetHttpState()
    vi.restoreAllMocks()
  })

  it('attaches the bearer token when present', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { ok: true } }))
    vi.stubGlobal('fetch', fetchMock)
    setAccessToken('token-123')

    await apiGet('/api/v1/auth/me')

    const [, init] = fetchMock.mock.calls[0]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-123')
  })

  it('refreshes once and retries on 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: 'UNAUTHENTICATED' } }, 401))
      .mockResolvedValueOnce(jsonResponse({ data: { access_token: 'new-token' } }))
      .mockResolvedValueOnce(jsonResponse({ data: ['retried'] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiGet<string[]>('/api/v1/users')

    expect(result).toEqual(['retried'])
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toContain('/api/v1/auth/refresh')
  })

  it('throws HttpError on a failed request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'FORBIDDEN', message: 'nope' } }, 403))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiGet('/api/v1/users')).rejects.toBeInstanceOf(HttpError)
  })
})
