import type { CartItem, Commodity, Offer, Product } from '@/types'

export function getStandardPrice(
  product: Product,
  commodities: Commodity[],
): number {
  const commodity = commodities.find((c) => c.id === product.commodityId)
  return commodity?.standardPrice ?? 0
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
}): { unitPrice: number; standardUnitPrice: number; pricingSource: 'standard' | 'negotiated'; offerId?: string } {
  const standardUnitPrice = getStandardPrice(input.product, input.commodities)
  const offer = input.offer

  if (offer && offer.productId === input.product.id && isOfferUsableForCheckout(offer)) {
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
    unitPrice: standardUnitPrice,
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
