import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import type { CartItem } from '@/types'

interface CartState {
  items: CartItem[]
  addItem: (
    vendorId: string,
    productId: string,
    quantity?: number,
    acceptedOfferId?: string,
  ) => { ok: true }
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  attachOffer: (productId: string, acceptedOfferId: string) => void
  clearCart: () => void
  resetCart: () => void
}

function upsertItem(
  items: CartItem[],
  vendorId: string,
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
            vendorId,
            quantity: item.quantity + quantity,
            acceptedOfferId: acceptedOfferId ?? item.acceptedOfferId,
          }
        : item,
    )
  }
  return [...items, { productId, vendorId, quantity, acceptedOfferId }]
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (vendorId, productId, quantity = 1, acceptedOfferId) => {
        set({
          items: upsertItem(
            get().items,
            vendorId,
            productId,
            quantity,
            acceptedOfferId,
          ),
        })
        return { ok: true }
      },
      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.productId !== productId),
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
      clearCart: () => set({ items: [] }),
      resetCart: () => set({ items: [] }),
    }),
    {
      name: `${STORAGE_PREFIX}-cart`,
      merge: (persisted, current) => {
        const p = persisted as Partial<CartState> & { vendorId?: string } | undefined
        const items = (p?.items ?? current.items).map((item) => ({
          ...item,
          vendorId: item.vendorId ?? '',
        }))
        return { ...current, ...p, items }
      },
    },
  ),
)
