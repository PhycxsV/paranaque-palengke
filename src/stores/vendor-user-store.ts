import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedVendorUsers } from '@/data/vendor-users'
import { validateVendorCredentials } from '@/lib/vendor-credentials'
import { generateId } from '@/lib/utils'
import type {
  VendorUser,
  VendorUserCreateInput,
  VendorUserUpdateInput,
} from '@/types'

interface VendorUserState {
  users: VendorUser[]
  addUser: (
    input: VendorUserCreateInput,
  ) => { ok: true; user: VendorUser } | { ok: false; message: string }
  updateUser: (
    userId: string,
    input: VendorUserUpdateInput,
  ) => { ok: true } | { ok: false; message: string }
  resetUsers: () => void
  getUserById: (userId: string) => VendorUser | undefined
}

export const useVendorUserStore = create<VendorUserState>()(
  persist(
    (set, get) => ({
      users: seedVendorUsers,
      getUserById: (userId) => get().users.find((u) => u.id === userId),
      addUser: (input) => {
        const name = input.name.trim()
        const email = input.email.trim().toLowerCase()
        const phone = input.phone.trim()
        const password = input.password
        if (!name) return { ok: false, message: 'Name is required.' }
        const credError = validateVendorCredentials({ email, phone, password })
        if (credError) return { ok: false, message: credError }
        if (get().users.some((u) => u.email === email)) {
          return { ok: false, message: 'That email is already used.' }
        }

        const user: VendorUser = {
          id: generateId('vuser'),
          name,
          email,
          phone,
          password,
          isActive: input.isActive ?? true,
        }
        set({ users: [user, ...get().users] })
        return { ok: true, user }
      },
      updateUser: (userId, input) => {
        const current = get().users.find((u) => u.id === userId)
        if (!current) return { ok: false, message: 'User not found.' }

        const name =
          input.name !== undefined ? input.name.trim() : current.name
        const email =
          input.email !== undefined
            ? input.email.trim().toLowerCase()
            : current.email
        const phone =
          input.phone !== undefined ? input.phone.trim() : current.phone
        const password =
          input.password !== undefined ? input.password : current.password

        if (!name) return { ok: false, message: 'Name is required.' }
        const credError = validateVendorCredentials({ email, phone, password })
        if (credError) return { ok: false, message: credError }
        if (
          get().users.some((u) => u.id !== userId && u.email === email)
        ) {
          return { ok: false, message: 'That email is already used.' }
        }

        set({
          users: get().users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  name,
                  email,
                  phone,
                  password,
                  isActive: input.isActive ?? u.isActive,
                }
              : u,
          ),
        })
        return { ok: true }
      },
      resetUsers: () => set({ users: structuredClone(seedVendorUsers) }),
    }),
    {
      name: `${STORAGE_PREFIX}-vendor-users`,
      merge: (persisted, current) => {
        const state = (persisted ?? {}) as Partial<VendorUserState>
        const list = Array.isArray(state.users) ? state.users : current.users
        return {
          ...current,
          ...state,
          users: list.map((u, i) => {
            const seed = seedVendorUsers.find((s) => s.id === u.id)
            return {
              id: u.id || seed?.id || `vuser-migrated-${i}`,
              name: u.name?.trim() || seed?.name || `Vendor user ${i + 1}`,
              email:
                u.email?.trim().toLowerCase() ||
                seed?.email ||
                `user${i + 1}@demo.palengke.ph`,
              phone: u.phone?.trim() || seed?.phone || `0917000${1000 + i}`,
              password: u.password || seed?.password || 'demo1234',
              isActive: u.isActive ?? true,
            }
          }),
        }
      },
    },
  ),
)
