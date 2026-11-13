import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedVendorUsers } from '@/data/vendor-users'
import { seedVendors } from '@/data/vendors'
import { generateId } from '@/lib/utils'
import type { Vendor, VendorCreateInput, VendorUpdateInput } from '@/types'

interface VendorState {
  vendors: Vendor[]
  addVendor: (
    input: VendorCreateInput,
  ) => { ok: true; vendor: Vendor } | { ok: false; message: string }
  updateVendor: (
    vendorId: string,
    input: VendorUpdateInput,
  ) => { ok: true } | { ok: false; message: string }
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

/** Strip old on-store credentials and ensure ownerUserId. */
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
    isDemo: true,
    demoQrLabel: raw.demoQrLabel || seed?.demoQrLabel || 'DEMO QR',
    ownerUserId,
  }
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      vendors: seedVendors,
      getStoresByOwner: (ownerUserId) =>
        get().vendors.filter((v) => v.ownerUserId === ownerUserId),
      addVendor: (input) => {
        const name = input.name.trim()
        const description = input.description.trim()
        const location = input.location.trim()
        const imageUrl = input.imageUrl.trim()
        const demoQrLabel = input.demoQrLabel.trim()
        if (!name) return { ok: false, message: 'Store name is required.' }
        if (!description) {
          return { ok: false, message: 'Description is required.' }
        }
        if (!location) return { ok: false, message: 'Stall location is required.' }
        if (!input.branchId) {
          return { ok: false, message: 'Select a palengke / market branch.' }
        }
        if (!input.ownerUserId) {
          return {
            ok: false,
            message: 'Select a vendor user who will own this store.',
          }
        }
        if (!imageUrl) return { ok: false, message: 'Image URL is required.' }
        if (!demoQrLabel) {
          return { ok: false, message: 'QR label is required.' }
        }
        if (input.categories.length === 0) {
          return { ok: false, message: 'Select at least one category.' }
        }
        const ratingError = validateRating(input.rating)
        if (ratingError) return { ok: false, message: ratingError }

        const vendor: Vendor = {
          id: generateId('vendor'),
          name,
          description,
          location,
          branchId: input.branchId,
          categories: input.categories,
          imageUrl,
          isAvailable: input.isAvailable,
          opensAt: input.opensAt,
          cutoffTime: input.cutoffTime,
          rating: Number(input.rating.toFixed(1)),
          isDemo: true,
          demoQrLabel,
          ownerUserId: input.ownerUserId,
        }

        set({ vendors: [vendor, ...get().vendors] })
        return { ok: true, vendor }
      },
      updateVendor: (vendorId, input) => {
        const current = get().vendors.find((v) => v.id === vendorId)
        if (!current) return { ok: false, message: 'Store not found.' }

        if (input.rating !== undefined) {
          const ratingError = validateRating(input.rating)
          if (ratingError) return { ok: false, message: ratingError }
        }
        if (input.ownerUserId !== undefined && !input.ownerUserId) {
          return { ok: false, message: 'Select a vendor user for this store.' }
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
      resetVendors: () => set({ vendors: structuredClone(seedVendors) }),
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
