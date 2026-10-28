import { describe, expect, it } from 'vitest'
import {
  buildOrderSnapshots,
  calculateCartTotal,
  canTransition,
  transitionOrder,
  validateCartAgainstStock,
} from './order-logic'
import { getAcceptedOfferUnitPrice, resolveCartUnitPrice } from './pricing'
import { canTransitionOffer, validateProposedPrice } from './offer-logic'
import type { CartItem, Commodity, Offer, Order, Product } from '@/types'

const commodities: Commodity[] = [
  {
    id: 'comm-kamatis',
    name: 'Kamatis',
    description: 'Tomatoes',
    category: 'Vegetables',
    unit: 'kg',
    standardPrice: 80,
    imageUrl: 'https://example.com/kamatis.jpg',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    isActive: true,
  },
]

const products: Product[] = [
  {
    id: 'p1',
    vendorId: 'v1',
    commodityId: 'comm-kamatis',
    name: 'Kamatis',
    description: 'Tomatoes',
    category: 'Vegetables',
    unit: 'kg',
    stock: 10,
    imageUrl: 'https://example.com/kamatis.jpg',
    isAvailable: true,
  },
]

const acceptedOffer: Offer = {
  id: 'offer-1',
  productId: 'p1',
  vendorId: 'v1',
  commodityId: 'comm-kamatis',
  productName: 'Kamatis',
  quantity: 2,
  unit: 'kg',
  standardUnitPriceSnapshot: 80,
  proposedUnitPrice: 70,
  status: 'accepted',
  customerLabel: 'Ana',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const baseOrder: Order = {
  id: 'ORD-1',
  vendorId: 'v1',
  vendorName: 'Demo Vendor',
  customerName: 'Ana',
  contactNumber: '09171234567',
  items: [],
  subtotal: 160,
  deliveryFee: 100,
  total: 260,
  status: 'pending_payment',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('pricing and offers', () => {
  it('uses LGU standard price by default', () => {
    const priced = resolveCartUnitPrice({
      product: products[0],
      quantity: 1,
      commodities,
    })
    expect(priced.unitPrice).toBe(80)
    expect(priced.pricingSource).toBe('standard')
  })

  it('applies negotiated price from accepted offer', () => {
    expect(getAcceptedOfferUnitPrice(acceptedOffer)).toBe(70)
    const priced = resolveCartUnitPrice({
      product: products[0],
      quantity: 2,
      commodities,
      offer: acceptedOffer,
    })
    expect(priced.unitPrice).toBe(70)
    expect(priced.pricingSource).toBe('negotiated')
  })

  it('rejects offers at or above standard price', () => {
    expect(validateProposedPrice(80, 80).ok).toBe(false)
    expect(validateProposedPrice(70, 80).ok).toBe(true)
  })

  it('enforces offer transitions', () => {
    expect(canTransitionOffer('pending', 'accepted')).toBe(true)
    expect(canTransitionOffer('accepted', 'rejected')).toBe(false)
  })
})

describe('order and cart logic', () => {
  it('calculates cart totals with negotiated pricing', () => {
    const items: CartItem[] = [
      { productId: 'p1', quantity: 2, acceptedOfferId: 'offer-1' },
    ]
    expect(calculateCartTotal(items, products, commodities, [acceptedOffer])).toBe(
      140,
    )
  })

  it('builds order snapshots with pricing source', () => {
    const snapshots = buildOrderSnapshots(
      [{ productId: 'p1', quantity: 2, acceptedOfferId: 'offer-1' }],
      products,
      commodities,
      [acceptedOffer],
    )
    expect(snapshots[0]).toMatchObject({
      unitPrice: 70,
      standardUnitPrice: 80,
      pricingSource: 'negotiated',
      lineTotal: 140,
    })
  })

  it('rejects invalid offer-linked quantities', () => {
    const result = validateCartAgainstStock(
      [{ productId: 'p1', quantity: 5, acceptedOfferId: 'offer-1' }],
      products,
      [acceptedOffer],
    )
    expect(result.ok).toBe(false)
  })

  it('enforces valid payment transitions', () => {
    expect(canTransition('pending_payment', 'awaiting_vendor_confirmation')).toBe(
      true,
    )
    const awaiting = transitionOrder(baseOrder, 'awaiting_vendor_confirmation')
    const confirmed = transitionOrder(awaiting, 'confirmed')
    expect(confirmed.status).toBe('confirmed')
    expect(() => transitionOrder(confirmed, 'payment_rejected')).toThrow()
  })
})
