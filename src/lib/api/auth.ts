import { apiRequest, setStoredToken } from './client'
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

function mapAuthUser(raw: StrapiUser, roleFallback?: AuthRole): AuthUser {
  return {
    id: raw.documentId || String(raw.id ?? ''),
    username: raw.username ?? '',
    email: raw.email ?? '',
    name: raw.name?.trim() || raw.username || '',
    phone: raw.phone ?? '',
    role: (raw.role?.type || roleFallback || 'authenticated') as AuthRole,
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

async function hydrateRole(
  jwt: string,
  loginUser: StrapiUser,
  roleHint?: AuthRole,
): Promise<AuthUser> {
  try {
    const me = await apiRequest<StrapiUser>('/users/me', {
      query: { 'populate[role]': 'true' },
      token: jwt,
    })
    return mapAuthUser(
      { ...loginUser, ...me, role: me.role ?? loginUser.role },
      roleHint,
    )
  } catch {
    return mapAuthUser(loginUser, roleHint)
  }
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
  const user = await hydrateRole(payload.jwt, payload.user, roleHint)
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
  const me = await apiRequest<StrapiUser>('/users/me', {
    query: { 'populate[role]': 'true' },
    token,
  })
  return mapAuthUser(me)
}

export function logoutLocal(): void {
  setStoredToken(null)
}
