import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedVendorUsers } from '@/data/vendor-users'
import {
  createVendorAccount,
  fetchVendors,
  isApiConfigured,
  updateVendorAccount,
} from '@/lib/api'
import { validateVendorCredentials } from '@/lib/vendor-credentials'
import { generateId } from '@/lib/utils'
import { useVendorStore } from '@/stores/vendor-store'
import type {
  VendorUser,
  VendorUserCreateInput,
  VendorUserUpdateInput,
} from '@/types'

interface VendorUserState {
  users: VendorUser[]
  addUser: (
    input: VendorUserCreateInput,
  ) => Promise<{ ok: true; user: VendorUser } | { ok: false; message: string }>
  updateUser: (
    userId: string,
    input: VendorUserUpdateInput,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  resetUsers: () => void
  getUserById: (userId: string) => VendorUser | undefined
}

export const useVendorUserStore = create<VendorUserState>()(
  persist(
    (set, get) => ({
      users: isApiConfigured() ? [] : seedVendorUsers,
      getUserById: (userId) => get().users.find((u) => u.id === userId),
      addUser: async (input) => {
        const name = input.name.trim()
        const email = input.email.trim().toLowerCase()
        const phone = input.phone.trim()
        const password = input.password
        if (!name) return { ok: false, message: 'Name is required.' }
        const credError = validateVendorCredentials({ email, phone, password })
        if (credError) return { ok: false, message: credError }

        if (isApiConfigured()) {
          const vendorIds = input.vendorIds?.filter(Boolean) ?? []
          if (vendorIds.length === 0) {
            return {
              ok: false,
              message: 'Select at least one store to assign to this user.',
            }
          }
          try {
            const user = await createVendorAccount({
              name,
              email,
              phone,
              password,
              vendorIds,
            })
            set({ users: [user, ...get().users.filter((u) => u.id !== user.id)] })
            const refreshed = await fetchVendors()
            useVendorStore.setState({ vendors: refreshed.vendors })
            return { ok: true, user }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to create vendor account.',
            }
          }
        }

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
      updateUser: async (userId, input) => {
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
        if (!email.includes('@')) {
          return { ok: false, message: 'Enter a valid email address.' }
        }
        if (phone.replace(/\D/g, '').length < 10) {
          return {
            ok: false,
            message: 'Enter a valid phone number (at least 10 digits).',
          }
        }
        if (input.password !== undefined && input.password.length < 8) {
          return {
            ok: false,
            message: 'Password must be at least 8 characters.',
          }
        }

        if (isApiConfigured()) {
          try {
            const updated = await updateVendorAccount(userId, {
              name,
              email,
              phone,
              isActive: input.isActive ?? current.isActive,
              ...(input.password !== undefined
                ? { password: input.password }
                : {}),
            })
            set({
              users: get().users.map((u) =>
                u.id === userId
                  ? {
                      ...u,
                      name: updated.name || name,
                      email: updated.email || email,
                      phone: updated.phone || phone,
                      password: '',
                      isActive: updated.isActive,
                    }
                  : u,
              ),
            })
            return { ok: true }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to update vendor account.',
            }
          }
        }

        const credError = validateVendorCredentials({ email, phone, password })
        if (credError) return { ok: false, message: credError }
        if (get().users.some((u) => u.id !== userId && u.email === email)) {
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
      resetUsers: () =>
        set({
          users: isApiConfigured() ? [] : structuredClone(seedVendorUsers),
        }),
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
                `user${i + 1}@palengke.ph`,
              phone: u.phone?.trim() || seed?.phone || `0917000${1000 + i}`,
              password: u.password || seed?.password || 'palengke1234',
              isActive: u.isActive ?? true,
            }
          }),
        }
      },
    },
  ),
)
