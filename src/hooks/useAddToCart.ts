import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart-store'
import { useVendorStore } from '@/stores/vendor-store'
import { isVendorAcceptingOrders } from '@/lib/vendor-hours'
import type { Product } from '@/types'

export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem)
  const vendors = useVendorStore((s) => s.vendors)

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

    addItem(product.vendorId, product.id, quantity, acceptedOfferId)
    toast.success(`${product.name} added to cart`)
  }

  return {
    addToCart,
    conflictOpen: false,
    currentVendorName: '',
    newVendorName: '',
    keepCurrentCart: () => undefined,
    replaceCart: () => undefined,
  }
}
