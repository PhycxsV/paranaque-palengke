import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedProducts } from '@/data/products'
import { generateId } from '@/lib/utils'
import type { Product, ProductFormInput } from '@/types'

interface ProductState {
  products: Product[]
  addProduct: (vendorId: string, input: ProductFormInput) => Product
  updateProduct: (
    productId: string,
    input: Partial<Omit<ProductFormInput, 'commodityId'>> & {
      commodityId?: string
    },
  ) => void
  toggleAvailability: (productId: string) => void
  archiveProduct: (productId: string) => void
  adjustStock: (productId: string, delta: number) => void
  resetProducts: () => void
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      addProduct: (vendorId, input) => {
        const product: Product = {
          id: generateId('PROD'),
          vendorId,
          ...input,
          isArchived: false,
        }
        set({ products: [...get().products, product] })
        return product
      },
      updateProduct: (productId, input) => {
        set({
          products: get().products.map((product) =>
            product.id === productId ? { ...product, ...input } : product,
          ),
        })
      },
      toggleAvailability: (productId) => {
        set({
          products: get().products.map((product) =>
            product.id === productId
              ? { ...product, isAvailable: !product.isAvailable }
              : product,
          ),
        })
      },
      archiveProduct: (productId) => {
        set({
          products: get().products.map((product) =>
            product.id === productId
              ? { ...product, isArchived: true, isAvailable: false }
              : product,
          ),
        })
      },
      adjustStock: (productId, delta) => {
        set({
          products: get().products.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  stock: Math.max(0, product.stock + delta),
                }
              : product,
          ),
        })
      },
      resetProducts: () => set({ products: structuredClone(seedProducts) }),
    }),
    {
      name: `${STORAGE_PREFIX}-products`,
    },
  ),
)
