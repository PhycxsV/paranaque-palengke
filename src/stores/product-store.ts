import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedProducts } from '@/data/products'
import {
  createProduct,
  isApiConfigured,
  updateProduct as updateProductApi,
} from '@/lib/api'
import { generateId } from '@/lib/utils'
import type { Product, ProductFormInput } from '@/types'

type ActionResult = { ok: true; product: Product } | { ok: false; message: string }

interface ProductState {
  products: Product[]
  addProduct: (
    vendorId: string,
    input: ProductFormInput,
  ) => Promise<ActionResult>
  updateProduct: (
    productId: string,
    input: Partial<Omit<ProductFormInput, 'commodityId'>> & {
      commodityId?: string
    },
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  toggleAvailability: (
    productId: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  archiveProduct: (
    productId: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  adjustStock: (productId: string, delta: number) => void
  resetProducts: () => void
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: isApiConfigured() ? [] : seedProducts,
      addProduct: async (vendorId, input) => {
        if (isApiConfigured()) {
          try {
            const product = await createProduct(vendorId, input)
            set({ products: [...get().products, product] })
            return { ok: true, product }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error ? error.message : 'Unable to add product.',
            }
          }
        }
        const product: Product = {
          id: generateId('PROD'),
          vendorId,
          ...input,
          isArchived: false,
        }
        set({ products: [...get().products, product] })
        return { ok: true, product }
      },
      updateProduct: async (productId, input) => {
        if (isApiConfigured()) {
          try {
            const product = await updateProductApi(productId, input)
            set({
              products: get().products.map((p) =>
                p.id === productId ? product : p,
              ),
            })
            return { ok: true }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to update product.',
            }
          }
        }
        set({
          products: get().products.map((product) =>
            product.id === productId ? { ...product, ...input } : product,
          ),
        })
        return { ok: true }
      },
      toggleAvailability: async (productId) => {
        const current = get().products.find((p) => p.id === productId)
        if (!current) return { ok: false, message: 'Product not found.' }
        return get().updateProduct(productId, {
          isAvailable: !current.isAvailable,
        })
      },
      archiveProduct: async (productId) => {
        if (isApiConfigured()) {
          try {
            const product = await updateProductApi(productId, {
              isArchived: true,
              isAvailable: false,
            })
            set({
              products: get().products.map((p) =>
                p.id === productId ? product : p,
              ),
            })
            return { ok: true }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to archive product.',
            }
          }
        }
        set({
          products: get().products.map((product) =>
            product.id === productId
              ? { ...product, isArchived: true, isAvailable: false }
              : product,
          ),
        })
        return { ok: true }
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
      resetProducts: () =>
        set({
          products: isApiConfigured() ? [] : structuredClone(seedProducts),
        }),
    }),
    {
      name: `${STORAGE_PREFIX}-products`,
    },
  ),
)
