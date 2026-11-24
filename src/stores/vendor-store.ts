import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedVendorUsers } from '@/data/vendor-users'
import { seedVendors } from '@/data/vendors'
import {
  createVendor,
  isApiConfigured,
  updateVendor as updateVendorApi,
  uploadVendorPaymentQr,
} from '@/lib/api'
import { generateId } from '@/lib/utils'
import type { Vendor, VendorCreateInput, VendorUpdateInput } from '@/types'

interface VendorState {
  vendors: Vendor[]
  addVendor: (
    input: VendorCreateInput,
  ) => Promise<{ ok: true; vendor: Vendor } | { ok: false; message: string }>
  updateVendor: (
    vendorId: string,
    input: VendorUpdateInput,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  uploadPaymentQr: (
    vendorId: string,
    file: File,
  ) => Promise<{ ok: true; paymentQrUrl: string } | { ok: false; message: string }>
  resetVendors: () => void
  getStoresByOwner: (ownerUserId: string) => Vendor[]
}

function validateRating(rating: number): string | null {
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return 'Rating must be between 1 and 5.'
  }
  return null
}

type LegacyVendor = Vendor & {
  email?: string
  phone?: string
  password?: string
}

function normalizeVendor(raw: LegacyVendor, index: number): Vendor {
  const seed = seedVendors.find((s) => s.id === raw.id)
  const ownerFromEmail = raw.email
    ? seedVendorUsers.find(
        (u) => u.email === raw.email!.trim().toLowerCase(),
      )?.id
    : undefined
  const ownerUserId =
    raw.ownerUserId ||
    seed?.ownerUserId ||
    ownerFromEmail ||
    seedVendorUsers[index]?.id ||
    seedVendorUsers[0]!.id

  return {
    id: raw.id || seed?.id || generateId('vendor'),
    name: raw.name || seed?.name || 'Store',
    description: raw.description || seed?.description || '',
    categories: raw.categories?.length
      ? raw.categories
      : (seed?.categories ?? ['Vegetables']),
    location: raw.location || seed?.location || '',
    branchId: raw.branchId || seed?.branchId || '',
    imageUrl: raw.imageUrl || seed?.imageUrl || '',
    isAvailable: raw.isAvailable ?? true,
    opensAt: raw.opensAt || seed?.opensAt || '05:00',
    cutoffTime: raw.cutoffTime || seed?.cutoffTime || '17:00',
    rating: raw.rating ?? seed?.rating ?? 4.5,
    qrLabel: (raw.qrLabel || seed?.qrLabel || 'Payment QR').replace(
      /\bDEMO\s+/gi,
      '',
    ).trim() || 'Payment QR',
    paymentQrUrl: raw.paymentQrUrl || seed?.paymentQrUrl || '',
    ownerUserId,
  }
}

function validateCreate(input: VendorCreateInput): string | null {
  if (!input.name.trim()) return 'Store name is required.'
  if (!input.description.trim()) return 'Description is required.'
  if (!input.location.trim()) return 'Stall location is required.'
  if (!input.branchId) return 'Select a palengke / market branch.'
  if (!input.imageUrl.trim()) return 'Image URL is required.'
  if (!input.qrLabel.trim()) return 'QR label is required.'
  if (input.categories.length === 0) return 'Select at least one category.'
  return validateRating(input.rating)
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      vendors: isApiConfigured() ? [] : seedVendors,
      getStoresByOwner: (ownerUserId) =>
        get().vendors.filter((v) => v.ownerUserId === ownerUserId),
      addVendor: async (input) => {
        const error = validateCreate(input)
        if (error) return { ok: false, message: error }
        if (!input.ownerUserId && !isApiConfigured()) {
          return {
            ok: false,
            message: 'Select a vendor user who will own this store.',
          }
        }

        if (isApiConfigured()) {
          try {
            const vendor = await createVendor(input)
            set({ vendors: [vendor, ...get().vendors] })
            return { ok: true, vendor }
          } catch (err) {
            return {
              ok: false,
              message:
                err instanceof Error ? err.message : 'Unable to create store.',
            }
          }
        }

        const vendor: Vendor = {
          id: generateId('vendor'),
          name: input.name.trim(),
          description: input.description.trim(),
          location: input.location.trim(),
          branchId: input.branchId,
          categories: input.categories,
          imageUrl: input.imageUrl.trim(),
          isAvailable: input.isAvailable,
          opensAt: input.opensAt,
          cutoffTime: input.cutoffTime,
          rating: Number(input.rating.toFixed(1)),
          qrLabel: input.qrLabel.trim(),
          paymentQrUrl: '',
          ownerUserId: input.ownerUserId ?? '',
        }

        set({ vendors: [vendor, ...get().vendors] })
        return { ok: true, vendor }
      },
      updateVendor: async (vendorId, input) => {
        const current = get().vendors.find((v) => v.id === vendorId)
        if (!current) return { ok: false, message: 'Store not found.' }

        if (input.rating !== undefined) {
          const ratingError = validateRating(input.rating)
          if (ratingError) return { ok: false, message: ratingError }
        }
        if (input.ownerUserId !== undefined && !input.ownerUserId) {
          return { ok: false, message: 'Select a vendor user for this store.' }
        }

        if (isApiConfigured()) {
          try {
            const vendor = await updateVendorApi(vendorId, input)
            set({
              vendors: get().vendors.map((v) =>
                v.id === vendorId ? vendor : v,
              ),
            })
            return { ok: true }
          } catch (err) {
            return {
              ok: false,
              message:
                err instanceof Error ? err.message : 'Unable to update store.',
            }
          }
        }

        set({
          vendors: get().vendors.map((vendor) => {
            if (vendor.id !== vendorId) return vendor
            const next: Vendor = {
              ...vendor,
              ...input,
              ownerUserId: input.ownerUserId ?? vendor.ownerUserId,
            }
            if (input.rating !== undefined) {
              next.rating = Number(input.rating.toFixed(1))
            }
            return next
          }),
        })
        return { ok: true }
      },
      uploadPaymentQr: async (vendorId, file) => {
        if (!isApiConfigured()) {
          return {
            ok: false,
            message: 'Payment QR upload needs a connection to the server.',
          }
        }
        try {
          const result = await uploadVendorPaymentQr(vendorId, file)
          set({
            vendors: get().vendors.map((v) =>
              v.id === vendorId ? { ...v, paymentQrUrl: result.paymentQrUrl } : v,
            ),
          })
          return { ok: true, paymentQrUrl: result.paymentQrUrl }
        } catch (err) {
          return {
            ok: false,
            message:
              err instanceof Error ? err.message : 'Unable to upload payment QR.',
          }
        }
      },
      resetVendors: () =>
        set({
          vendors: isApiConfigured() ? [] : structuredClone(seedVendors),
        }),
    }),
    {
      name: `${STORAGE_PREFIX}-vendors`,
      merge: (persisted, current) => {
        const state = (persisted ?? {}) as Partial<VendorState>
        const list = Array.isArray(state.vendors) ? state.vendors : current.vendors
        return {
          ...current,
          ...state,
          vendors: list.map((v, i) => normalizeVendor(v as LegacyVendor, i)),
        }
      },
    },
  ),
)
