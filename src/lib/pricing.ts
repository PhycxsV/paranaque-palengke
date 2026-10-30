import type { CartItem, Commodity, Offer, Product } from '@/types'

/** Midpoint of LGU range — used as reference / offer snapshot. */
export function getRangeMidpoint(commodity: Commodity): number {
  return Number(((commodity.priceMin + commodity.priceMax) / 2).toFixed(2))
}

export function getCommodityRange(
  product: Product,
  commodities: Commodity[],
): { min: number; max: number } | null {
  const commodity = commodities.find((c) => c.id === product.commodityId)
  if (!commodity) return null
  return { min: commodity.priceMin, max: commodity.priceMax }
}

/** Vendor-declared selling price (falls back to range midpoint). */
export function getVendorPrice(
  product: Product,
  commodities: Commodity[] = [],
): number {
  if (Number.isFinite(product.vendorPrice) && product.vendorPrice > 0) {
    return product.vendorPrice
  }
  const commodity = commodities.find((c) => c.id === product.commodityId)
  return commodity ? getRangeMidpoint(commodity) : 0
}

/** @deprecated Prefer getVendorPrice — kept as alias for existing call sites. */
export function getStandardPrice(
  product: Product,
  commodities: Commodity[],
): number {
  return getVendorPrice(product, commodities)
}

export function isPriceInRange(
  price: number,
  commodity: Pick<Commodity, 'priceMin' | 'priceMax'>,
): boolean {
  return (
    Number.isFinite(price) &&
    price >= commodity.priceMin &&
    price <= commodity.priceMax
  )
}

export function getPriceRangeMessage(
  price: number,
  commodity: Pick<Commodity, 'priceMin' | 'priceMax' | 'name'>,
): string | null {
  if (!Number.isFinite(price) || price <= 0) {
    return 'Enter a valid price.'
  }
  if (price > commodity.priceMax) {
    return `Above the LGU range (₱${commodity.priceMin.toFixed(2)}–₱${commodity.priceMax.toFixed(2)}).`
  }
  if (price < commodity.priceMin) {
    return `Below the LGU range (₱${commodity.priceMin.toFixed(2)}–₱${commodity.priceMax.toFixed(2)}).`
  }
  return null
}

export function getAcceptedOfferUnitPrice(offer: Offer): number | null {
  if (offer.status === 'accepted') return offer.proposedUnitPrice
  if (offer.status === 'counter_accepted' && offer.counterUnitPrice != null) {
    return offer.counterUnitPrice
  }
  return null
}

export function isOfferUsableForCheckout(offer: Offer): boolean {
  return getAcceptedOfferUnitPrice(offer) != null
}

export function resolveCartUnitPrice(input: {
  product: Product
  quantity: number
  commodities: Commodity[]
  offer?: Offer
}): {
  unitPrice: number
  standardUnitPrice: number
  pricingSource: 'standard' | 'negotiated'
  offerId?: string
} {
  const vendorUnitPrice = getVendorPrice(input.product, input.commodities)
  const commodity = input.commodities.find(
    (c) => c.id === input.product.commodityId,
  )
  const standardUnitPrice = commodity
    ? getRangeMidpoint(commodity)
    : vendorUnitPrice
  const offer = input.offer

  if (
    offer &&
    offer.productId === input.product.id &&
    isOfferUsableForCheckout(offer)
  ) {
    const negotiated = getAcceptedOfferUnitPrice(offer)
    if (
      negotiated != null &&
      input.quantity > 0 &&
      input.quantity <= offer.quantity
    ) {
      return {
        unitPrice: negotiated,
        standardUnitPrice,
        pricingSource: 'negotiated',
        offerId: offer.id,
      }
    }
  }

  return {
    unitPrice: vendorUnitPrice,
    standardUnitPrice,
    pricingSource: 'standard',
  }
}

export function calculateLineTotal(unitPrice: number, quantity: number): number {
  return Number((unitPrice * quantity).toFixed(2))
}

export function calculateCartTotalWithPricing(
  items: CartItem[],
  products: Product[],
  commodities: Commodity[],
  offers: Offer[],
): number {
  return Number(
    items
      .reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId)
        if (!product) return sum
        const offer = item.acceptedOfferId
          ? offers.find((o) => o.id === item.acceptedOfferId)
          : undefined
        const { unitPrice } = resolveCartUnitPrice({
          product,
          quantity: item.quantity,
          commodities,
          offer,
        })
        return sum + unitPrice * item.quantity
      }, 0)
      .toFixed(2),
  )
}

export function groupCartItemsByVendor(
  items: CartItem[],
  products: Product[],
): Map<string, CartItem[]> {
  const groups = new Map<string, CartItem[]>()
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)
    const vendorId = item.vendorId || product?.vendorId
    if (!vendorId) continue
    const list = groups.get(vendorId) ?? []
    list.push(item)
    groups.set(vendorId, list)
  }
  return groups
}
