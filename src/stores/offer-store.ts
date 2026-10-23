import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import {
  transitionOffer,
  validateProposedPrice,
} from '@/lib/offer-logic'
import { getStandardPrice } from '@/lib/pricing'
import { generateId } from '@/lib/utils'
import type { Commodity, Offer, OfferFormInput, Product } from '@/types'

interface OfferState {
  offers: Offer[]
  createOffer: (input: {
    form: OfferFormInput
    product: Product
    commodities: Commodity[]
  }) => { ok: true; offer: Offer } | { ok: false; message: string }
  acceptOffer: (
    offerId: string,
    vendorId: string,
  ) => { ok: true; offer: Offer } | { ok: false; message: string }
  rejectOffer: (
    offerId: string,
    vendorId: string,
  ) => { ok: true; offer: Offer } | { ok: false; message: string }
  counterOffer: (
    offerId: string,
    vendorId: string,
    counterUnitPrice: number,
  ) => { ok: true; offer: Offer } | { ok: false; message: string }
  acceptCounter: (
    offerId: string,
  ) => { ok: true; offer: Offer } | { ok: false; message: string }
  declineCounter: (
    offerId: string,
  ) => { ok: true; offer: Offer } | { ok: false; message: string }
  getOffersByVendor: (vendorId: string) => Offer[]
  getOfferById: (offerId: string) => Offer | undefined
  resetOffers: () => void
}

export const useOfferStore = create<OfferState>()(
  persist(
    (set, get) => ({
      offers: [],
      createOffer: ({ form, product, commodities }) => {
        if (!product.isAvailable || product.isArchived) {
          return { ok: false, message: 'This product is unavailable.' }
        }
        if (form.quantity <= 0 || form.quantity > product.stock) {
          return {
            ok: false,
            message: `Choose a quantity between 1 and ${product.stock}.`,
          }
        }

        const standardUnitPrice = getStandardPrice(product, commodities)
        const validation = validateProposedPrice(
          form.proposedUnitPrice,
          standardUnitPrice,
        )
        if (!validation.ok) return validation

        const now = new Date().toISOString()
        const offer: Offer = {
          id: generateId('OFFER'),
          productId: product.id,
          vendorId: product.vendorId,
          commodityId: product.commodityId,
          productName: product.name,
          quantity: form.quantity,
          unit: product.unit,
          standardUnitPriceSnapshot: standardUnitPrice,
          proposedUnitPrice: Number(form.proposedUnitPrice.toFixed(2)),
          status: 'pending',
          customerLabel: form.customerLabel?.trim() || 'Demo Customer',
          createdAt: now,
          updatedAt: now,
          note: form.note?.trim() || undefined,
        }

        set({ offers: [offer, ...get().offers] })
        return { ok: true, offer }
      },
      acceptOffer: (offerId, vendorId) => {
        const offer = get().offers.find((o) => o.id === offerId)
        if (!offer) return { ok: false, message: 'Offer not found.' }
        if (offer.vendorId !== vendorId) {
          return { ok: false, message: 'You can only manage your own offers.' }
        }
        try {
          const updated = transitionOffer(offer, 'accepted')
          set({
            offers: get().offers.map((o) => (o.id === offerId ? updated : o)),
          })
          return { ok: true, offer: updated }
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : 'Unable to accept offer.',
          }
        }
      },
      rejectOffer: (offerId, vendorId) => {
        const offer = get().offers.find((o) => o.id === offerId)
        if (!offer) return { ok: false, message: 'Offer not found.' }
        if (offer.vendorId !== vendorId) {
          return { ok: false, message: 'You can only manage your own offers.' }
        }
        try {
          const updated = transitionOffer(offer, 'rejected')
          set({
            offers: get().offers.map((o) => (o.id === offerId ? updated : o)),
          })
          return { ok: true, offer: updated }
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : 'Unable to reject offer.',
          }
        }
      },
      counterOffer: (offerId, vendorId, counterUnitPrice) => {
        const offer = get().offers.find((o) => o.id === offerId)
        if (!offer) return { ok: false, message: 'Offer not found.' }
        if (offer.vendorId !== vendorId) {
          return { ok: false, message: 'You can only manage your own offers.' }
        }
        if (!Number.isFinite(counterUnitPrice) || counterUnitPrice <= 0) {
          return { ok: false, message: 'Enter a valid counteroffer price.' }
        }
        if (counterUnitPrice >= offer.standardUnitPriceSnapshot) {
          return {
            ok: false,
            message: 'Counteroffer should stay below the LGU standard price.',
          }
        }
        try {
          const updated = transitionOffer(offer, 'countered', {
            counterUnitPrice: Number(counterUnitPrice.toFixed(2)),
          })
          set({
            offers: get().offers.map((o) => (o.id === offerId ? updated : o)),
          })
          return { ok: true, offer: updated }
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : 'Unable to submit counteroffer.',
          }
        }
      },
      acceptCounter: (offerId) => {
        const offer = get().offers.find((o) => o.id === offerId)
        if (!offer) return { ok: false, message: 'Offer not found.' }
        try {
          const updated = transitionOffer(offer, 'counter_accepted')
          set({
            offers: get().offers.map((o) => (o.id === offerId ? updated : o)),
          })
          return { ok: true, offer: updated }
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : 'Unable to accept counteroffer.',
          }
        }
      },
      declineCounter: (offerId) => {
        const offer = get().offers.find((o) => o.id === offerId)
        if (!offer) return { ok: false, message: 'Offer not found.' }
        try {
          const updated = transitionOffer(offer, 'counter_declined')
          set({
            offers: get().offers.map((o) => (o.id === offerId ? updated : o)),
          })
          return { ok: true, offer: updated }
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : 'Unable to decline counteroffer.',
          }
        }
      },
      getOffersByVendor: (vendorId) =>
        get().offers.filter((o) => o.vendorId === vendorId),
      getOfferById: (offerId) => get().offers.find((o) => o.id === offerId),
      resetOffers: () => set({ offers: [] }),
    }),
    {
      name: `${STORAGE_PREFIX}-offers`,
    },
  ),
)
