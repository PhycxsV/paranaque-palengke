import { apiFetchAll, apiRequest } from './client'
import { mapOrder, type StrapiOrder } from './mappers'
import type { CheckoutFormInput, DeliveryStatus, Order } from '@/types'

const ORDER_POPULATE = {
  'populate[vendor]': 'true',
  'populate[customer]': 'true',
  'sort[0]': 'createdAt:desc',
} as const

export async function fetchOrders(): Promise<Order[]> {
  const rows = await apiFetchAll<StrapiOrder>('/orders', {
    query: { ...ORDER_POPULATE },
  })
  return rows.map(mapOrder)
}

export async function checkoutOrders(input: {
  customer: CheckoutFormInput
  items: Array<{ productId: string; quantity: number }>
}): Promise<Order[]> {
  const payload = await apiRequest<{ data: StrapiOrder[] }>('/orders/checkout', {
    method: 'POST',
    body: {
      customerName: input.customer.customerName.trim(),
      contactNumber: input.customer.contactNumber.trim(),
      deliveryAddress: input.customer.deliveryAddress.trim(),
      notes: input.customer.notes?.trim() || undefined,
      items: input.items,
    },
  })

  // Reload the booking group; checkout returns a slim payload.
  const bookingGroupId = payload.data[0]?.bookingGroupId
  if (!bookingGroupId) {
    return (payload.data ?? []).map(mapOrder)
  }

  const rows = await apiFetchAll<StrapiOrder>('/orders', {
    query: {
      ...ORDER_POPULATE,
      'filters[bookingGroupId][$eq]': bookingGroupId,
    },
  })
  if (rows.length > 0) return rows.map(mapOrder)
  return (payload.data ?? []).map(mapOrder)
}

export async function submitOrderPayment(
  orderId: string,
  transactionReference: string,
): Promise<Pick<Order, 'id' | 'status'>> {
  const payload = await apiRequest<{
    data: { documentId: string; status: Order['status'] }
  }>(`/orders/${orderId}/payment`, {
    method: 'POST',
    body: { transactionReference },
  })
  return { id: payload.data.documentId, status: payload.data.status }
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
      status: Order['status']
      deliveryStatus?: DeliveryStatus
    }
  }>(`/orders/${orderId}/vendor-decision`, {
    method: 'POST',
    body: { status },
  })
  return {
    id: payload.data.documentId,
    status: payload.data.status,
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
