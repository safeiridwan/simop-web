const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export interface ApiError {
  code: string
  message: string
}

interface ErrorEnvelope {
  error?: ApiError
}

/** GET a success-enveloped endpoint and unwrap `data`. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json' },
  })
  const body = (await res.json()) as { data: T } & ErrorEnvelope
  if (!res.ok) {
    throw new Error(body.error?.message ?? `Request failed with status ${res.status}`)
  }
  return body.data
}
