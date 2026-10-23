import { ALLOWED_ORDER_TRANSITIONS } from '@/constants'
import {
  calculateLineTotal,
  resolveCartUnitPrice,
} from '@/lib/pricing'
import type {
  CartItem,
  Commodity,
  Offer,
  Order,
  OrderItemSnapshot,
  OrderStatus,
  Product,
} from '@/types'

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_ORDER_TRANSITIONS[from].includes(to)
}

export function buildOrderSnapshots(
  items: CartItem[],
  products: Product[],
  commodities: Commodity[],
  offers: Offer[],
): OrderItemSnapshot[] {
  return items.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    if (!product) {
      throw new Error(`Product ${item.productId} not found`)
    }
    const offer = item.acceptedOfferId
      ? offers.find((o) => o.id === item.acceptedOfferId)
      : undefined
    const priced = resolveCartUnitPrice({
      product,
      quantity: item.quantity,
      commodities,
      offer,
    })
    return {
      productId: product.id,
      commodityId: product.commodityId,
      name: product.name,
      unit: product.unit,
      unitPrice: priced.unitPrice,
      standardUnitPrice: priced.standardUnitPrice,
      quantity: item.quantity,
      lineTotal: calculateLineTotal(priced.unitPrice, item.quantity),
      imageUrl: product.imageUrl,
      pricingSource: priced.pricingSource,
      offerId: priced.offerId,
    }
  })
}

export function calculateCartTotal(
  items: CartItem[],
  products: Product[],
  commodities: Commodity[],
  offers: Offer[],
): number {
  return Number(
    buildOrderSnapshots(items, products, commodities, offers)
      .reduce((sum, line) => sum + line.lineTotal, 0)
      .toFixed(2),
  )
}

export function validateCartAgainstStock(
  items: CartItem[],
  products: Product[],
  offers: Offer[] = [],
): { ok: true } | { ok: false; message: string } {
  if (items.length === 0) {
    return { ok: false, message: 'Your cart is empty.' }
  }

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)
    if (!product || product.isArchived || !product.isAvailable) {
      return {
        ok: false,
        message: `${product?.name ?? 'A product'} is no longer available.`,
      }
    }
    if (item.quantity > product.stock) {
      return {
        ok: false,
        message: `Only ${product.stock} ${product.unit} of ${product.name} available.`,
      }
    }
    if (item.quantity <= 0) {
      return { ok: false, message: 'Quantities must be greater than zero.' }
    }
    if (item.acceptedOfferId) {
      const offer = offers.find((o) => o.id === item.acceptedOfferId)
      if (!offer) {
        return { ok: false, message: 'A linked offer is no longer available.' }
      }
      if (offer.status !== 'accepted' && offer.status !== 'counter_accepted') {
        return {
          ok: false,
          message: `The offer for ${product.name} is not accepted yet.`,
        }
      }
      if (item.quantity > offer.quantity) {
        return {
          ok: false,
          message: `Negotiated price for ${product.name} only covers up to ${offer.quantity} ${product.unit}.`,
        }
      }
    }
  }

  return { ok: true }
}

export function transitionOrder(
  order: Order,
  nextStatus: OrderStatus,
  extras: Partial<Order> = {},
): Order {
  if (!canTransition(order.status, nextStatus)) {
    throw new Error(
      `Invalid transition from ${order.status} to ${nextStatus}`,
    )
  }

  return {
    ...order,
    ...extras,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  }
}
