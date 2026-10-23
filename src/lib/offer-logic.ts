import type { Offer, OfferStatus } from '@/types'

export const ALLOWED_OFFER_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  pending: ['accepted', 'rejected', 'countered'],
  countered: ['counter_accepted', 'counter_declined'],
  accepted: [],
  rejected: [],
  counter_accepted: [],
  counter_declined: [],
}

export function canTransitionOffer(from: OfferStatus, to: OfferStatus): boolean {
  return ALLOWED_OFFER_TRANSITIONS[from].includes(to)
}

export function transitionOffer(
  offer: Offer,
  nextStatus: OfferStatus,
  extras: Partial<Offer> = {},
): Offer {
  if (!canTransitionOffer(offer.status, nextStatus)) {
    throw new Error(`Invalid offer transition from ${offer.status} to ${nextStatus}`)
  }
  return {
    ...offer,
    ...extras,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  }
}

export function validateProposedPrice(
  proposedUnitPrice: number,
  standardUnitPrice: number,
): { ok: true } | { ok: false; message: string } {
  if (!Number.isFinite(proposedUnitPrice) || proposedUnitPrice <= 0) {
    return { ok: false, message: 'Enter a valid offer price greater than zero.' }
  }
  if (proposedUnitPrice >= standardUnitPrice) {
    return {
      ok: false,
      message: 'Your offer should be lower than the LGU standard price to tumawad.',
    }
  }
  return { ok: true }
}
