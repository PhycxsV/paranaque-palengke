import { useState } from 'react'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart-store'
import { useVendorStore } from '@/stores/vendor-store'
import { isVendorAcceptingOrders } from '@/lib/vendor-hours'
import type { Product } from '@/types'

export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem)
  const forceAddFromVendor = useCartStore((s) => s.forceAddFromVendor)
  const cartVendorId = useCartStore((s) => s.vendorId)
  const vendors = useVendorStore((s) => s.vendors)

  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)
  const [pendingQty, setPendingQty] = useState(1)
  const [pendingOfferId, setPendingOfferId] = useState<string | undefined>()

  const addToCart = (product: Product, quantity = 1, acceptedOfferId?: string) => {
    if (!product.isAvailable || product.stock <= 0) {
      toast.error('This product is currently unavailable.')
      return
    }

    const vendor = vendors.find((v) => v.id === product.vendorId)
    if (vendor && !isVendorAcceptingOrders(vendor)) {
      toast.error('This vendor is past cut-off and is not accepting new orders.')
      return
    }

    const result = addItem(product.vendorId, product.id, quantity, acceptedOfferId)
    if (!result.ok) {
      setPendingProduct(product)
      setPendingQty(quantity)
      setPendingOfferId(acceptedOfferId)
      return
    }
    toast.success(`${product.name} added to cart`)
  }

  const keepCurrentCart = () => {
    setPendingProduct(null)
    setPendingOfferId(undefined)
  }

  const replaceCart = () => {
    if (!pendingProduct) return
    forceAddFromVendor(pendingProduct.vendorId, pendingProduct.id, pendingQty, pendingOfferId)
    toast.success(`Cart cleared. ${pendingProduct.name} added.`)
    setPendingProduct(null)
    setPendingOfferId(undefined)
  }

  const currentVendorName =
    vendors.find((v) => v.id === cartVendorId)?.name ?? 'your current vendor'
  const newVendorName =
    vendors.find((v) => v.id === pendingProduct?.vendorId)?.name ?? 'another vendor'

  return {
    addToCart,
    conflictOpen: Boolean(pendingProduct),
    currentVendorName,
    newVendorName,
    keepCurrentCart,
    replaceCart,
  }
}
