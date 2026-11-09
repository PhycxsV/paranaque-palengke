import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedVendors } from '@/data/vendors'
import { generateId } from '@/lib/utils'
import type { Vendor, VendorCreateInput, VendorUpdateInput } from '@/types'

interface VendorState {
  vendors: Vendor[]
  addVendor: (
    input: VendorCreateInput,
  ) => { ok: true; vendor: Vendor } | { ok: false; message: string }
  updateVendor: (vendorId: string, input: VendorUpdateInput) => void
  resetVendors: () => void
}

function validateRating(rating: number): string | null {
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return 'Rating must be between 1 and 5.'
  }
  return null
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      vendors: seedVendors,
      addVendor: (input) => {
        const name = input.name.trim()
        const description = input.description.trim()
        const location = input.location.trim()
        const imageUrl = input.imageUrl.trim()
        const demoQrLabel = input.demoQrLabel.trim()
        if (!name) return { ok: false, message: 'Vendor name is required.' }
        if (!description) {
          return { ok: false, message: 'Description is required.' }
        }
        if (!location) return { ok: false, message: 'Stall location is required.' }
        if (!input.branchId) {
          return { ok: false, message: 'Select a palengke / market branch.' }
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
        }

        set({ vendors: [vendor, ...get().vendors] })
        return { ok: true, vendor }
      },
      updateVendor: (vendorId, input) => {
        set({
          vendors: get().vendors.map((vendor) => {
            if (vendor.id !== vendorId) return vendor
            const next: Vendor = { ...vendor, ...input }
            if (input.rating !== undefined) {
              next.rating = Number(input.rating.toFixed(1))
            }
            return next
          }),
        })
      },
      resetVendors: () => set({ vendors: structuredClone(seedVendors) }),
    }),
    {
      name: `${STORAGE_PREFIX}-vendors`,
    },
  ),
)
