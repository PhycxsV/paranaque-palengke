import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedVendors } from '@/data/vendors'
import type { Vendor, VendorProfileInput } from '@/types'

interface VendorState {
  vendors: Vendor[]
  updateVendor: (vendorId: string, input: VendorProfileInput) => void
  resetVendors: () => void
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      vendors: seedVendors,
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
