import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedVendors } from '@/data/vendors'
import type { DemoRole } from '@/types'
import { useCartStore } from './cart-store'
import { useCommodityStore } from './commodity-store'
import { useOfferStore } from './offer-store'
import { useOrderStore } from './order-store'
import { useProductStore } from './product-store'
import { useVendorStore } from './vendor-store'

interface DemoSessionState {
  role: DemoRole
  activeVendorId: string
  setRole: (role: DemoRole) => void
  setActiveVendorId: (vendorId: string) => void
  resetDemoData: () => void
}

export const useDemoSessionStore = create<DemoSessionState>()(
  persist(
    (set) => ({
      role: 'customer',
      activeVendorId: seedVendors[0]?.id ?? 'vendor-aling-nena',
      setRole: (role) => set({ role }),
      setActiveVendorId: (vendorId) => set({ activeVendorId: vendorId }),
      resetDemoData: () => {
        useCommodityStore.getState().resetCommodities()
        useProductStore.getState().resetProducts()
        useVendorStore.getState().resetVendors()
        useCartStore.getState().resetCart()
        useOrderStore.getState().resetOrders()
        useOfferStore.getState().resetOffers()
        set({
          role: 'customer',
          activeVendorId: seedVendors[0]?.id ?? 'vendor-aling-nena',
        })
      },
    }),
    {
      name: `${STORAGE_PREFIX}-session`,
    },
  ),
)
