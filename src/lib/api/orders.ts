import { apiFetchAll, apiRequest, apiUpload, resolveMediaUrl } from './client'
import { mapOrder, type StrapiOrder } from './mappers'
import type { CheckoutFormInput, DeliveryStatus, Order } from '@/types'

const ORDER_POPULATE = {
  'populate[vendor]': 'true',
  'sort[0]': 'createdAt:desc',
} as const

export async function fetchOrders(): Promise<Order[]> {
  const rows = await apiFetchAll<StrapiOrder>('/orders', {
    query: { ...ORDER_POPULATE },
  })
  return rows.map(mapOrder)
}

export interface DeliveryQuote {
  deliveryCost: number
  distanceKm: number
  branchId: string
  branchName: string
}

/** Quote Keri delivery fee for the cart before the customer pays. */
export async function quoteDeliveryFee(input: {
  dropoffLat: number
  dropoffLng: number
  productIds: string[]
}): Promise<DeliveryQuote> {
  if (
    !Number.isFinite(input.dropoffLat) ||
    !Number.isFinite(input.dropoffLng)
  ) {
    throw new Error('Enter valid drop-off latitude and longitude.')
  }
  if (!input.productIds.length) {
    throw new Error('Cart is empty.')
  }

  const payload = await apiRequest<{ data: DeliveryQuote }>(
    '/orders/delivery-quote',
    {
      method: 'POST',
      body: {
        dropoffLat: input.dropoffLat,
        dropoffLng: input.dropoffLng,
        productIds: input.productIds,
      },
    },
  )
  const quote = payload.data
  if (
    !quote ||
    !Number.isFinite(quote.deliveryCost) ||
    quote.deliveryCost < 0
  ) {
    throw new Error('Delivery quote returned an invalid fee.')
  }
  return quote
}

export async function checkoutOrders(input: {
  customer: CheckoutFormInput
  items: Array<{ productId: string; quantity: number }>
  /** One distance per cart vendor: dropoff pin → that vendor's branch. */
  vendorDistances: Array<{ vendorId: string; distanceKm: number }>
}): Promise<Order[]> {
  const { dropoffLat, dropoffLng } = input.customer
  if (
    dropoffLat === null ||
    dropoffLng === null ||
    !Number.isFinite(dropoffLat) ||
    !Number.isFinite(dropoffLng)
  ) {
    throw new Error('Enter valid drop-off latitude and longitude.')
  }
  if (!input.vendorDistances.length) {
    throw new Error('Missing vendor distances for checkout.')
  }

  const payload = await apiRequest<{ data: StrapiOrder[] }>('/orders/checkout', {
    method: 'POST',
    body: {
      customerName: input.customer.customerName.trim(),
      contactNumber: input.customer.contactNumber.trim(),
      deliveryAddress: input.customer.deliveryAddress.trim(),
      dropoffLat,
      dropoffLng,
      dropoffLandmark: input.customer.dropoffLandmark.trim(),
      notes: input.customer.notes?.trim() || undefined,
      items: input.items,
      vendorDistances: input.vendorDistances,
    },
  })

  const fromCheckout = (payload.data ?? []).map((row) =>
    mapOrder({
      ...row,
      customerName: row.customerName ?? input.customer.customerName.trim(),
      contactNumber: row.contactNumber ?? input.customer.contactNumber.trim(),
      deliveryAddress:
        row.deliveryAddress ?? input.customer.deliveryAddress.trim(),
      notes: row.notes ?? (input.customer.notes?.trim() || undefined),
    }),
  )

  // Prefer a full reload of the booking group when the list endpoint works.
  const bookingGroupId = payload.data[0]?.bookingGroupId
  if (!bookingGroupId) return fromCheckout

  try {
    const rows = await apiFetchAll<StrapiOrder>('/orders', {
      query: {
        ...ORDER_POPULATE,
        'filters[bookingGroupId][$eq]': bookingGroupId,
      },
    })
    if (rows.length > 0) return rows.map(mapOrder)
  } catch {
    // Fall back to the checkout payload (includes items).
  }
  return fromCheckout
}

/** Submits the payment reference and the required proof-of-payment photo. */
export async function submitOrderPayment(
  orderId: string,
  transactionReference: string,
  proofFile: File,
): Promise<Pick<Order, 'id' | 'status' | 'paymentProofUrl'>> {
  const formData = new FormData()
  formData.append('transactionReference', transactionReference)
  formData.append('files', proofFile)

  const payload = await apiUpload<{
    data: {
      documentId: string
      paymentStatus?: Order['status']
      status?: Order['status']
      paymentProof?: { url?: string | null } | null
    }
  }>(`/orders/${orderId}/payment`, formData)
  return {
    id: payload.data.documentId,
    status:
      payload.data.paymentStatus ??
      payload.data.status ??
      'awaiting_vendor_confirmation',
    paymentProofUrl: resolveMediaUrl(payload.data.paymentProof?.url) || undefined,
  }
}

export async function vendorDecideOrder(
  orderId: string,
  status: 'confirmed' | 'payment_rejected',
): Promise<{
  id: string
  status: Order['status']
  deliveryStatus?: DeliveryStatus
}> {
  const payload = await apiRequest<{
    data: {
      documentId: string
      paymentStatus?: Order['status']
      status?: Order['status']
      deliveryStatus?: DeliveryStatus
    }
  }>(`/orders/${orderId}/vendor-decision`, {
    method: 'POST',
    // Request body still uses `status` for the decision value (Axel API).
    body: { status },
  })
  return {
    id: payload.data.documentId,
    status: payload.data.paymentStatus ?? payload.data.status ?? status,
    deliveryStatus: payload.data.deliveryStatus,
  }
}

export async function advanceOrderDelivery(
  orderId: string,
  deliveryStatus: DeliveryStatus,
  keriTrackingId?: string,
): Promise<{
  id: string
  deliveryStatus?: DeliveryStatus
  pickupCode?: string
  keriTrackingId?: string
}> {
  const payload = await apiRequest<{
    data: {
      documentId: string
      deliveryStatus?: DeliveryStatus
      pickupCode?: string
      keriTrackingId?: string
    }
  }>(`/orders/${orderId}/delivery`, {
    method: 'POST',
    body: {
      deliveryStatus,
      ...(keriTrackingId ? { keriTrackingId } : {}),
    },
  })
  return {
    id: payload.data.documentId,
    deliveryStatus: payload.data.deliveryStatus,
    pickupCode: payload.data.pickupCode,
    keriTrackingId: payload.data.keriTrackingId,
  }
}

export async function cancelOrderApi(
  orderId: string,
  reason?: string,
): Promise<{
  id: string
  status: Order['status']
  cancelledBy?: 'customer' | 'vendor' | 'system'
  cancelledAt?: string
  cancelReason?: string
}> {
  const payload = await apiRequest<{
    data: {
      documentId: string
      paymentStatus?: Order['status']
      cancelledBy?: 'customer' | 'vendor' | 'system'
      cancelledAt?: string
      cancelReason?: string | null
    }
  }>(`/orders/${orderId}/cancel`, {
    method: 'POST',
    body: reason?.trim() ? { reason: reason.trim() } : {},
  })
  return {
    id: payload.data.documentId,
    status: payload.data.paymentStatus ?? 'cancelled',
    cancelledBy: payload.data.cancelledBy,
    cancelledAt: payload.data.cancelledAt,
    cancelReason: payload.data.cancelReason || undefined,
  }
}

export type KeriDraftStatus =
  | 'created'
  | 'sending'
  | 'blocked'
  | 'failed'
  | 'not_ready'

export interface KeriDraftResult {
  bookingGroupId: string
  status: KeriDraftStatus
  error?: string
  alreadyCreated?: boolean
  alreadySending?: boolean
}

/** LGU admin: (re)send a ready booking group to Keri as a draft booking. */
export async function retryKeriDraft(
  bookingGroupId: string,
): Promise<KeriDraftResult> {
  const payload = await apiRequest<{ data: KeriDraftResult }>(
    `/orders/booking-groups/${encodeURIComponent(bookingGroupId)}/keri-draft`,
    { method: 'POST', body: {} },
  )
  return {
    ...payload.data,
    bookingGroupId: payload.data?.bookingGroupId ?? bookingGroupId,
  }
}
