import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import type { CartItem } from '@/types'

interface CartState {
  vendorId: string | null
  items: CartItem[]
  addItem: (
    vendorId: string,
    productId: string,
    quantity?: number,
    acceptedOfferId?: string,
  ) => { ok: true } | { ok: false; conflict: true }
  forceAddFromVendor: (
    vendorId: string,
    productId: string,
    quantity?: number,
    acceptedOfferId?: string,
  ) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  attachOffer: (productId: string, acceptedOfferId: string) => void
  clearCart: () => void
  resetCart: () => void
}

function upsertItem(
  items: CartItem[],
  productId: string,
  quantity: number,
  acceptedOfferId?: string,
): CartItem[] {
  const existing = items.find((item) => item.productId === productId)
  if (existing) {
    return items.map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity: item.quantity + quantity,
            acceptedOfferId: acceptedOfferId ?? item.acceptedOfferId,
          }
        : item,
    )
  }
  return [...items, { productId, quantity, acceptedOfferId }]
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      vendorId: null,
      items: [],
      addItem: (vendorId, productId, quantity = 1, acceptedOfferId) => {
        const state = get()
        if (state.vendorId && state.vendorId !== vendorId && state.items.length > 0) {
          return { ok: false, conflict: true }
        }
        set({
          vendorId,
          items: upsertItem(state.items, productId, quantity, acceptedOfferId),
        })
        return { ok: true }
      },
      forceAddFromVendor: (vendorId, productId, quantity = 1, acceptedOfferId) => {
        set({
          vendorId,
          items: [{ productId, quantity, acceptedOfferId }],
        })
      },
      removeItem: (productId) => {
        const items = get().items.filter((item) => item.productId !== productId)
        set({
          items,
          vendorId: items.length === 0 ? null : get().vendorId,
        })
      },
      setQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item,
          ),
        })
      },
      attachOffer: (productId, acceptedOfferId) => {
        set({
          items: get().items.map((item) =>
            item.productId === productId ? { ...item, acceptedOfferId } : item,
          ),
        })
      },
      clearCart: () => set({ vendorId: null, items: [] }),
      resetCart: () => set({ vendorId: null, items: [] }),
    }),
    {
      name: `${STORAGE_PREFIX}-cart`,
    },
  ),
)
