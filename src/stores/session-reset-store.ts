import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedVendors } from '@/data/vendors'
import type { AppRole } from '@/types'
import { useCartStore } from './cart-store'
import { useCommodityStore } from './commodity-store'
import { useChatStore } from './chat-store'
import { useCustomerProfileStore } from './customer-profile-store'
import { useFeedbackStore } from './feedback-store'
import { useOfferStore } from './offer-store'
import { useOrderStore } from './order-store'
import { useProductStore } from './product-store'
import { useVendorStore } from './vendor-store'
import { useVendorUserStore } from './vendor-user-store'

interface SessionState {
  role: AppRole
  activeVendorId: string
  setRole: (role: AppRole) => void
  setActiveVendorId: (vendorId: string) => void
  resetAppData: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      role: 'customer',
      activeVendorId: seedVendors[0]?.id ?? 'vendor-aling-nena',
      setRole: (role) => set({ role }),
      setActiveVendorId: (vendorId) => set({ activeVendorId: vendorId }),
      resetAppData: () => {
        useCommodityStore.getState().resetCommodities()
        useProductStore.getState().resetProducts()
        useVendorStore.getState().resetVendors()
        useVendorUserStore.getState().resetUsers()
        useCartStore.getState().resetCart()
        useOrderStore.getState().resetOrders()
        useOfferStore.getState().resetOffers()
        useChatStore.getState().resetChats()
        useFeedbackStore.getState().resetFeedback()
        useCustomerProfileStore.getState().resetProfile()
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
