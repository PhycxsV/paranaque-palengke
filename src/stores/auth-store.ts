import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import {
  ApiError,
  fetchCurrentUser,
  getStoredToken,
  isApiConfigured,
  loginWithPassword,
  logoutLocal,
  registerCustomer,
  setStoredToken,
  type AuthRole,
  type AuthUser,
} from '@/lib/api'

interface AuthState {
  user: AuthUser | null
  jwt: string | null
  hydrated: boolean
  login: (
    identifier: string,
    password: string,
    roleHint?: AuthRole,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  register: (input: {
    username: string
    email: string
    password: string
    name?: string
    phone?: string
  }) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
  restoreSession: () => Promise<void>
  role: () => AuthRole | null
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      jwt: null,
      hydrated: false,
      role: () => get().user?.role ?? null,
      isAuthenticated: () => Boolean(get().jwt && get().user),
      login: async (identifier, password, roleHint) => {
        if (!isApiConfigured()) {
          return { ok: false, message: 'API is not configured.' }
        }
        try {
          const session = await loginWithPassword(
            identifier.trim(),
            password,
            roleHint,
          )
          set({ user: session.user, jwt: session.jwt, hydrated: true })
          return { ok: true }
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : 'Unable to sign in.',
          }
        }
      },
      register: async (input) => {
        if (!isApiConfigured()) {
          return { ok: false, message: 'API is not configured.' }
        }
        try {
          await registerCustomer(input)
          logoutLocal()
          set({ user: null, jwt: null, hydrated: true })
          return { ok: true }
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : 'Unable to register.',
          }
        }
      },
      logout: () => {
        logoutLocal()
        set({ user: null, jwt: null, hydrated: true })
      },
      restoreSession: async () => {
        if (!isApiConfigured()) {
          set({ hydrated: true, user: null, jwt: null })
          return
        }
        const token = get().jwt || getStoredToken()
        if (!token) {
          set({ hydrated: true, user: null, jwt: null })
          return
        }
        try {
          setStoredToken(token)
          const user = await fetchCurrentUser(token)
          const cached = get().user
          if (cached && cached.id === user.id) {
            if (!user.name?.trim() && cached.name) user.name = cached.name
            if (!user.phone?.trim() && cached.phone) user.phone = cached.phone
            // Do not copy role from cache — that previously stamped portal
            // hints onto accounts whose /users/me omitted role.type.
          }
          set({ user, jwt: token, hydrated: true })
        } catch (error) {
          // Expired/invalid token → clear so we don't look signed in with empty data.
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            logoutLocal()
            set({ user: null, jwt: null, hydrated: true })
            return
          }
          // Keep the session only when the API is temporarily unreachable.
          const latestUser = get().user
          const latestJwt = get().jwt || getStoredToken() || token
          if (latestUser && latestJwt) {
            set({ user: latestUser, jwt: latestJwt, hydrated: true })
            return
          }
          logoutLocal()
          set({ user: null, jwt: null, hydrated: true })
        }
      },
    }),
    {
      name: `${STORAGE_PREFIX}-auth`,
      partialize: (state) => ({ jwt: state.jwt, user: state.user }),
    },
  ),
)
