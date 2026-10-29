import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DELIVERY_FEE, STORAGE_PREFIX } from '@/constants'
import {
  buildOrderSnapshots,
  calculateCartTotal,
  transitionOrder,
  validateCartAgainstStock,
} from '@/lib/order-logic'
import { generateId } from '@/lib/utils'
import type {
  CartItem,
  CheckoutFormInput,
  Commodity,
  DeliveryStatus,
  Offer,
  Order,
  Product,
} from '@/types'

const DELIVERY_FLOW: DeliveryStatus[] = [
  'awaiting_pickup',
  'out_for_delivery',
  'delivered',
]

interface OrderState {
  orders: Order[]
  createOrder: (input: {
    vendorId: string
    vendorName: string
    items: CartItem[]
    products: Product[]
    commodities: Commodity[]
    offers: Offer[]
    customer: CheckoutFormInput
  }) => { ok: true; order: Order } | { ok: false; message: string }
  submitDemoPayment: (
    orderId: string,
    transactionReference?: string,
  ) => { ok: true; order: Order } | { ok: false; message: string }
  confirmPayment: (
    orderId: string,
    vendorId: string,
  ) => { ok: true; order: Order } | { ok: false; message: string }
  rejectPayment: (
    orderId: string,
    vendorId: string,
  ) => { ok: true; order: Order } | { ok: false; message: string }
  advanceDelivery: (
    orderId: string,
    vendorId: string,
  ) => { ok: true; order: Order } | { ok: false; message: string }
  getOrderById: (orderId: string) => Order | undefined
  getOrdersByVendor: (vendorId: string) => Order[]
  resetOrders: () => void
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      createOrder: ({
        vendorId,
        vendorName,
        items,
        products,
        commodities,
        offers,
        customer,
      }) => {
        const validation = validateCartAgainstStock(items, products, offers)
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        const snapshots = buildOrderSnapshots(
          items,
          products,
          commodities,
          offers,
        )
        const subtotal = calculateCartTotal(items, products, commodities, offers)
        const deliveryFee = DELIVERY_FEE
        const total = subtotal + deliveryFee
        const now = new Date().toISOString()
        const order: Order = {
          id: generateId('ORD'),
          vendorId,
          vendorName,
          customerName: customer.customerName.trim(),
          contactNumber: customer.contactNumber.trim(),
          notes: customer.notes?.trim() || undefined,
          items: snapshots,
          subtotal,
          deliveryFee,
          total,
          status: 'pending_payment',
          createdAt: now,
          updatedAt: now,
        }

        set({ orders: [order, ...get().orders] })
        return { ok: true, order }
      },
      submitDemoPayment: (orderId, transactionReference) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return { ok: false, message: 'Order not found.' }

        try {
          const updated = transitionOrder(order, 'awaiting_vendor_confirmation', {
            transactionReference: transactionReference?.trim() || undefined,
            paymentSubmittedAt: new Date().toISOString(),
          })
          set({
            orders: get().orders.map((o) => (o.id === orderId ? updated : o)),
          })
          return { ok: true, order: updated }
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : 'Unable to submit payment.',
          }
        }
      },
      confirmPayment: (orderId, vendorId) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return { ok: false, message: 'Order not found.' }
        if (order.vendorId !== vendorId) {
          return { ok: false, message: 'You can only confirm your own orders.' }
        }

        try {
          const updated = transitionOrder(order, 'confirmed', {
            deliveryStatus: 'awaiting_pickup',
          })
          set({
            orders: get().orders.map((o) => (o.id === orderId ? updated : o)),
          })
          return { ok: true, order: updated }
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : 'Unable to confirm payment.',
          }
        }
      },
      advanceDelivery: (orderId, vendorId) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return { ok: false, message: 'Order not found.' }
        if (order.vendorId !== vendorId) {
          return { ok: false, message: 'You can only update your own orders.' }
        }
        if (order.status !== 'confirmed') {
          return {
            ok: false,
            message: 'Confirm payment before updating Keri delivery.',
          }
        }

        const current = order.deliveryStatus ?? 'awaiting_pickup'
        const idx = DELIVERY_FLOW.indexOf(current)
        if (idx < 0 || idx >= DELIVERY_FLOW.length - 1) {
          return { ok: false, message: 'Delivery is already complete.' }
        }

        const next = DELIVERY_FLOW[idx + 1]
        const updated: Order = {
          ...order,
          deliveryStatus: next,
          updatedAt: new Date().toISOString(),
        }
        set({
          orders: get().orders.map((o) => (o.id === orderId ? updated : o)),
        })
        return { ok: true, order: updated }
      },
      rejectPayment: (orderId, vendorId) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return { ok: false, message: 'Order not found.' }
        if (order.vendorId !== vendorId) {
          return { ok: false, message: 'You can only reject your own orders.' }
        }

        try {
          const updated = transitionOrder(order, 'payment_rejected')
          set({
            orders: get().orders.map((o) => (o.id === orderId ? updated : o)),
          })
          return { ok: true, order: updated }
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : 'Unable to reject payment.',
          }
        }
      },
      getOrderById: (orderId) => get().orders.find((o) => o.id === orderId),
      getOrdersByVendor: (vendorId) =>
        get().orders.filter((o) => o.vendorId === vendorId),
      resetOrders: () => set({ orders: [] }),
    }),
    {
      name: `${STORAGE_PREFIX}-orders`,
    },
  ),
)
