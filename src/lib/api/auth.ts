import { ApiError, apiRequest, setStoredToken } from './client'
import type { StrapiUser } from './mappers'

export type AuthRole = 'customer' | 'vendor' | 'lgu-admin' | 'authenticated' | string

export interface AuthUser {
  id: string
  username: string
  email: string
  name: string
  phone: string
  role: AuthRole
}

export interface AuthSession {
  jwt: string
  user: AuthUser
}

type SessionMe = {
  documentId?: string
  id?: number | string
  username?: string
  email?: string
  name?: string
  phone?: string
  role?: { type?: string } | null
}

function mapAuthUser(raw: StrapiUser, roleType?: string | null): AuthUser {
  return {
    id: raw.documentId || String(raw.id ?? ''),
    username: raw.username ?? '',
    email: raw.email ?? '',
    name: raw.name?.trim() || raw.username || '',
    phone: raw.phone ?? '',
    // Prefer /session/me role — Strapi /users/me omits role entirely.
    role: (roleType || raw.role?.type || 'authenticated') as AuthRole,
  }
}

/** Maps a return path to the portal role expected for that route. */
export function inferRoleFromPath(path: string): AuthRole | undefined {
  const value = path.toLowerCase()
  if (value.includes('/vendor')) return 'vendor'
  if (value.includes('/admin')) return 'lgu-admin'
  if (value.includes('/customer') || value.includes('/checkout') || value.includes('/orders')) {
    return 'customer'
  }
  return undefined
}

async function fetchSessionRole(jwt: string): Promise<string | null> {
  try {
    const payload = await apiRequest<{ data: SessionMe }>('/session/me', { token: jwt })
    return payload.data?.role?.type ?? null
  } catch {
    return null
  }
}

async function hydrateRole(jwt: string, loginUser: StrapiUser): Promise<AuthUser> {
  const roleType = await fetchSessionRole(jwt)
  try {
    const me = await apiRequest<StrapiUser>('/users/me', {
      query: { 'populate[role]': 'true' },
      token: jwt,
    })
    return mapAuthUser(
      {
        ...loginUser,
        ...me,
        role: me.role ?? loginUser.role,
      },
      roleType,
    )
  } catch {
    return mapAuthUser(loginUser, roleType)
  }
}

function portalRoleError(roleHint: AuthRole): string {
  if (roleHint === 'vendor') return 'This account is not a vendor account.'
  if (roleHint === 'lgu-admin') return 'This account is not an LGU admin account.'
  if (roleHint === 'customer') {
    return 'This account cannot use the customer storefront login.'
  }
  return 'This account cannot sign in to this portal.'
}

export async function loginWithPassword(
  identifier: string,
  password: string,
  roleHint?: AuthRole,
): Promise<AuthSession> {
  const payload = await apiRequest<{ jwt: string; user: StrapiUser }>(
    '/auth/local',
    {
      method: 'POST',
      auth: false,
      body: { identifier, password },
    },
  )
  setStoredToken(payload.jwt)
  const user = await hydrateRole(payload.jwt, payload.user)
  if (roleHint && user.role !== roleHint) {
    setStoredToken(null)
    throw new ApiError(portalRoleError(roleHint), 403)
  }
  return { jwt: payload.jwt, user }
}

/**
 * Creates a customer account via `/auth/local/register`.
 * Does not leave the user signed in — call login afterward.
 * Only username, email, and password are accepted by the public endpoint;
 * name/phone are applied with a one-off authenticated update when allowed.
 */
export async function registerCustomer(input: {
  username: string
  email: string
  password: string
  name?: string
  phone?: string
}): Promise<void> {
  const payload = await apiRequest<{ jwt: string; user: StrapiUser }>(
    '/auth/local/register',
    {
      method: 'POST',
      auth: false,
      body: {
        username: input.username,
        email: input.email,
        password: input.password,
      },
    },
  )

  if (input.name || input.phone) {
    try {
      await apiRequest(`/users/${payload.user.id ?? payload.user.documentId}`, {
        method: 'PUT',
        token: payload.jwt,
        body: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.phone ? { phone: input.phone } : {}),
        },
      })
    } catch {
      // Profile fields may remain unset until the backend allows self-update.
    }
  }

  // Discard the register JWT so the user must sign in explicitly.
  setStoredToken(null)
}

export async function fetchCurrentUser(token?: string): Promise<AuthUser> {
  const jwt = token
  const roleType = jwt ? await fetchSessionRole(jwt) : null
  const me = await apiRequest<StrapiUser>('/users/me', {
    query: { 'populate[role]': 'true' },
    token,
  })
  return mapAuthUser(me, roleType)
}

export function logoutLocal(): void {
  setStoredToken(null)
}
