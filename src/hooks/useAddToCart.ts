import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart-store'
import { useVendorStore } from '@/stores/vendor-store'
import { getSellableStock, isAllStockReserved } from '@/lib/stock'
import { isVendorAcceptingOrders } from '@/lib/vendor-hours'
import type { Product } from '@/types'

export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)
  const vendors = useVendorStore((s) => s.vendors)

  const addToCart = (product: Product, quantity = 1, acceptedOfferId?: string) => {
    const sellable = getSellableStock(product)
    if (!product.isAvailable || sellable <= 0) {
      toast.error(
        isAllStockReserved(product)
          ? 'This item is currently reserved in another checkout. Please try again in a few minutes.'
          : 'This product is currently unavailable.',
      )
      return
    }
    const existingQty =
      items.find((i) => i.productId === product.id)?.quantity ?? 0
    if (existingQty + quantity > sellable) {
      toast.error(
        `Only ${sellable} ${product.unit} of ${product.name} available right now.`,
      )
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
