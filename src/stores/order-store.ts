import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DELIVERY_FEE, STORAGE_PREFIX } from '@/constants'
import {
  buildOrderSnapshots,
  calculateCartTotal,
  transitionOrder,
  validateCartAgainstStock,
} from '@/lib/order-logic'
import { groupCartItemsByVendor } from '@/lib/pricing'
import { generateId } from '@/lib/utils'
import { isVendorAcceptingOrders } from '@/lib/vendor-hours'
import type {
  CartItem,
  CheckoutFormInput,
  Commodity,
  DeliveryStatus,
  Offer,
  Order,
  Product,
  Vendor,
} from '@/types'

const DELIVERY_FLOW: DeliveryStatus[] = [
  'awaiting_pickup',
  'out_for_delivery',
  'delivered',
]

function paidEnoughForConfirm(status: Order['status']): boolean {
  return (
    status === 'awaiting_vendor_confirmation' ||
    status === 'confirmed' ||
    status === 'payment_rejected'
  )
}

interface OrderState {
  orders: Order[]
  createCheckoutOrders: (input: {
    items: CartItem[]
    products: Product[]
    commodities: Commodity[]
    offers: Offer[]
    vendors: Vendor[]
    customer: CheckoutFormInput
  }) => { ok: true; orders: Order[]; checkoutGroupId: string } | { ok: false; message: string }
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
  getOrdersByCheckoutGroup: (checkoutGroupId: string) => Order[]
  resetOrders: () => void
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      createCheckoutOrders: ({
        items,
        products,
        commodities,
        offers,
        vendors,
        customer,
      }) => {
        const validation = validateCartAgainstStock(items, products, offers)
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        const groups = groupCartItemsByVendor(items, products)
        if (groups.size === 0) {
          return { ok: false, message: 'Your cart is empty.' }
        }

        for (const vendorId of groups.keys()) {
          const vendor = vendors.find((v) => v.id === vendorId)
          if (!vendor) {
            return { ok: false, message: 'A vendor in your cart was not found.' }
          }
          if (!isVendorAcceptingOrders(vendor)) {
            return {
              ok: false,
              message: `${vendor.name} is past cut-off and cannot accept orders.`,
            }
          }
        }

        const vendorCount = groups.size
        const deliveryShare = Number((DELIVERY_FEE / vendorCount).toFixed(2))
        // Fix rounding remainder on first vendor
        let remainder = Number(
          (DELIVERY_FEE - deliveryShare * vendorCount).toFixed(2),
        )

        const checkoutGroupId = generateId('GRP')
        const now = new Date().toISOString()
        const created: Order[] = []

        for (const [vendorId, vendorItems] of groups) {
          const vendor = vendors.find((v) => v.id === vendorId)!
          const snapshots = buildOrderSnapshots(
            vendorItems,
            products,
            commodities,
            offers,
          )
          const subtotal = calculateCartTotal(
            vendorItems,
            products,
            commodities,
            offers,
          )
          const fee = deliveryShare + (remainder !== 0 ? remainder : 0)
          if (remainder !== 0) remainder = 0

          created.push({
            id: generateId('ORD'),
            checkoutGroupId,
            vendorId,
            vendorName: vendor.name,
            customerName: customer.customerName.trim(),
            contactNumber: customer.contactNumber.trim(),
            notes: customer.notes?.trim() || undefined,
            items: snapshots,
            subtotal,
            deliveryFee: fee,
            total: Number((subtotal + fee).toFixed(2)),
            status: 'pending_payment',
            createdAt: now,
            updatedAt: now,
          })
        }

        set({ orders: [...created, ...get().orders] })
        return { ok: true, orders: created, checkoutGroupId }
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

        const siblings = get().orders.filter(
          (o) => o.checkoutGroupId === order.checkoutGroupId,
        )
        const allPaid = siblings.every((o) => paidEnoughForConfirm(o.status))
        if (!allPaid) {
          return {
            ok: false,
            message:
              'Cannot confirm yet — customer must finalize payment for all vendors in this checkout.',
          }
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

        const siblings = get().orders.filter(
          (o) => o.checkoutGroupId === order.checkoutGroupId,
        )
        const allConfirmed = siblings.every((o) => o.status === 'confirmed')
        if (!allConfirmed) {
          return {
            ok: false,
            message:
              'Keri delivery starts only after all vendor payments in this checkout are confirmed.',
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
      getOrdersByCheckoutGroup: (checkoutGroupId) =>
        get().orders.filter((o) => o.checkoutGroupId === checkoutGroupId),
      resetOrders: () => set({ orders: [] }),
    }),
    {
      name: `${STORAGE_PREFIX}-orders`,
      merge: (persisted, current) => {
        const p = persisted as Partial<OrderState> | undefined
        const orders = (p?.orders ?? current.orders).map((o) => ({
          ...o,
          checkoutGroupId: o.checkoutGroupId || o.id,
        }))
        return { ...current, ...p, orders }
      },
    },
  ),
)
