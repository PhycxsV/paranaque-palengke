import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedVendors } from '@/data/vendors'
import { generateId } from '@/lib/utils'
import type { Vendor, VendorCreateInput, VendorProfileInput } from '@/types'

interface VendorState {
  vendors: Vendor[]
  addVendor: (
    input: VendorCreateInput,
  ) => { ok: true; vendor: Vendor } | { ok: false; message: string }
  updateVendor: (vendorId: string, input: VendorProfileInput) => void
  resetVendors: () => void
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
          isDemo: true,
          demoQrLabel,
        }

        set({ vendors: [vendor, ...get().vendors] })
        return { ok: true, vendor }
      },
      updateVendor: (vendorId, input) => {
        set({
          vendors: get().vendors.map((vendor) =>
            vendor.id === vendorId ? { ...vendor, ...input } : vendor,
          ),
        })
      },
      resetVendors: () => set({ vendors: structuredClone(seedVendors) }),
    }),
    {
      name: `${STORAGE_PREFIX}-vendors`,
    },
  ),
)
