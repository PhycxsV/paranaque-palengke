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

function validateCoords(lat: number, lng: number): string | null {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return 'Latitude must be between -90 and 90.'
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return 'Longitude must be between -180 and 180.'
  }
  return null
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
        if (!location) return { ok: false, message: 'Location is required.' }
        if (!imageUrl) return { ok: false, message: 'Image URL is required.' }
        if (!demoQrLabel) {
          return { ok: false, message: 'QR label is required.' }
        }
        if (input.categories.length === 0) {
          return { ok: false, message: 'Select at least one category.' }
        }
        const ratingError = validateRating(input.rating)
        if (ratingError) return { ok: false, message: ratingError }
        const coordsError = validateCoords(input.lat, input.lng)
        if (coordsError) return { ok: false, message: coordsError }

        const vendor: Vendor = {
          id: generateId('vendor'),
          name,
          description,
          location,
          categories: input.categories,
          imageUrl,
          isAvailable: input.isAvailable,
          opensAt: input.opensAt,
          cutoffTime: input.cutoffTime,
          rating: Number(input.rating.toFixed(1)),
          lat: input.lat,
          lng: input.lng,
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
