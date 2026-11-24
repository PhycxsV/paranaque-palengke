import { STORAGE_PREFIX } from '@/constants'

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL as string | undefined
)?.replace(/\/$/, '')

export function isApiConfigured(): boolean {
  return Boolean(API_BASE_URL)
}

/** Resolve a Strapi media `url` (absolute or `/uploads/...`) for <img src>. */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const origin = (API_BASE_URL ?? '').replace(/\/api\/?$/, '')
  if (!origin) return url
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`
}

const TOKEN_KEY = `${STORAGE_PREFIX}-auth-jwt`

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // localStorage may be unavailable
  }
}

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  token?: string | null
  auth?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback
  const err = payload as {
    error?: { message?: string; details?: unknown }
    message?: string
  }
  return err.error?.message || err.message || fallback
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError('API URL is not configured (set VITE_API_URL).', 0)
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let token =
    options.token !== undefined
      ? options.token
      : options.auth === false
        ? null
        : getStoredToken()

  // Fall back to the in-memory auth session if the dedicated JWT key is missing.
  if (!token && options.auth !== false && options.token === undefined) {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}-auth`)
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { jwt?: string | null } }
        token = parsed.state?.jwt ?? null
        if (token) setStoredToken(token)
      }
    } catch {
      // ignore malformed persisted auth
    }
  }

  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(
    `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}${buildQuery(options.query)}`,
    {
      method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    },
  )

  return parseResponse<T>(response)
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(payload, `Request failed (${response.status})`),
      response.status,
      payload,
    )
  }

  return payload as T
}

/**
 * Multipart upload (e.g. Strapi `files` field). Does not set `Content-Type`
 * so the browser adds the multipart boundary.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { method?: string; token?: string | null } = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError('API URL is not configured (set VITE_API_URL).', 0)
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = options.token !== undefined ? options.token : getStoredToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(
    `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`,
    {
      method: options.method ?? 'POST',
      headers,
      body: formData,
    },
  )

  return parseResponse<T>(response)
}

/** Fetches every page of a collection endpoint (page size 100). */
export async function apiFetchAll<T>(
  path: string,
  options: Omit<RequestOptions, 'query'> & {
    query?: Record<string, string | number | boolean | undefined | null>
  } = {},
): Promise<T[]> {
  const pageSize = 100
  let page = 1
  const items: T[] = []

  for (;;) {
    const payload = await apiRequest<{
      data: T[]
      meta?: { pagination?: { pageCount?: number } }
    }>(path, {
      ...options,
      query: {
        ...options.query,
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
      },
    })
    items.push(...(payload.data ?? []))
    const pageCount = payload.meta?.pagination?.pageCount ?? 1
    if (page >= pageCount) break
    page += 1
  }

  return items
}
