import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedBranches } from '@/data/branches'
import {
  createBranch,
  isApiConfigured,
  updateBranch as updateBranchApi,
} from '@/lib/api'
import { generateId } from '@/lib/utils'
import type { Branch, BranchFormInput } from '@/types'

interface BranchState {
  branches: Branch[]
  addBranch: (
    input: BranchFormInput,
  ) => Promise<{ ok: true; branch: Branch } | { ok: false; message: string }>
  updateBranch: (
    branchId: string,
    input: BranchFormInput,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  getBranchById: (branchId: string) => Branch | undefined
  resetBranches: () => void
}

function validateBranch(input: BranchFormInput): string | null {
  if (!input.name.trim()) return 'Palengke name is required.'
  if (!input.address.trim()) return 'Address is required.'
  if (!Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90) {
    return 'Latitude must be between -90 and 90.'
  }
  if (!Number.isFinite(input.lng) || input.lng < -180 || input.lng > 180) {
    return 'Longitude must be between -180 and 180.'
  }
  return null
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: isApiConfigured() ? [] : seedBranches,
      addBranch: async (input) => {
        const error = validateBranch(input)
        if (error) return { ok: false, message: error }
        if (isApiConfigured()) {
          try {
            const branch = await createBranch(input)
            set({ branches: [branch, ...get().branches] })
            return { ok: true, branch }
          } catch (err) {
            return {
              ok: false,
              message:
                err instanceof Error ? err.message : 'Unable to create branch.',
            }
          }
        }
        const branch: Branch = {
          id: generateId('branch'),
          name: input.name.trim(),
          address: input.address.trim(),
          lat: input.lat,
          lng: input.lng,
          isActive: input.isActive,
        }
        set({ branches: [branch, ...get().branches] })
        return { ok: true, branch }
      },
      updateBranch: async (branchId, input) => {
        const error = validateBranch(input)
        if (error) return { ok: false, message: error }
        if (isApiConfigured()) {
          try {
            const branch = await updateBranchApi(branchId, input)
            set({
              branches: get().branches.map((b) =>
                b.id === branchId ? branch : b,
              ),
            })
            return { ok: true }
          } catch (err) {
            return {
              ok: false,
              message:
                err instanceof Error ? err.message : 'Unable to update branch.',
            }
          }
        }
        const exists = get().branches.some((b) => b.id === branchId)
        if (!exists) return { ok: false, message: 'Palengke not found.' }
        set({
          branches: get().branches.map((branch) =>
            branch.id === branchId
              ? {
                  ...branch,
                  name: input.name.trim(),
                  address: input.address.trim(),
                  lat: input.lat,
                  lng: input.lng,
                  isActive: input.isActive,
                }
              : branch,
          ),
        })
        return { ok: true }
      },
      getBranchById: (branchId) =>
        get().branches.find((b) => b.id === branchId),
      resetBranches: () =>
        set({
          branches: isApiConfigured() ? [] : structuredClone(seedBranches),
        }),
    }),
    {
      name: `${STORAGE_PREFIX}-branches`,
    },
  ),
)
