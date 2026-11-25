import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DELIVERY_FEE, STORAGE_PREFIX } from '@/constants'
import {
  advanceOrderDelivery,
  checkoutOrders,
  isApiConfigured,
  submitOrderPayment,
  vendorDecideOrder,
} from '@/lib/api'
import {
  DELIVERY_FLOW,
  generatePickupCode,
  normalizeDeliveryStatus,
} from '@/lib/delivery'
import {
  buildOrderSnapshots,
  calculateCartTotal,
  transitionOrder,
  validateCartAgainstStock,
} from '@/lib/order-logic'
import { groupCartItemsByVendor } from '@/lib/pricing'
import { distanceKm } from '@/lib/coordinates'
import { generateId } from '@/lib/utils'
import { isVendorAcceptingOrders } from '@/lib/vendor-hours'
import { useBranchStore } from '@/stores/branch-store'
import { useProductStore } from '@/stores/product-store'
import type {
  CartItem,
  CheckoutFormInput,
  Commodity,
  Offer,
  Order,
  Product,
  Vendor,
} from '@/types'

function paidEnoughForConfirm(status: Order['status']): boolean {
  return (
    status === 'awaiting_vendor_confirmation' ||
    status === 'confirmed' ||
    status === 'payment_rejected'
  )
}

type ActionResult =
  | { ok: true; order: Order }
  | { ok: false; message: string }

type CheckoutResult =
  | { ok: true; orders: Order[]; bookingGroupId: string }
  | { ok: false; message: string }

interface OrderState {
  orders: Order[]
  createCheckoutOrders: (input: {
    items: CartItem[]
    products: Product[]
    commodities: Commodity[]
    offers: Offer[]
    vendors: Vendor[]
    customer: CheckoutFormInput
  }) => Promise<CheckoutResult>
  submitPayment: (
    orderId: string,
    transactionReference?: string,
  ) => Promise<ActionResult>
  confirmPayment: (orderId: string, vendorId: string) => Promise<ActionResult>
  rejectPayment: (orderId: string, vendorId: string) => Promise<ActionResult>
  advanceDelivery: (orderId: string, vendorId: string) => Promise<ActionResult>
  getOrderById: (orderId: string) => Order | undefined
  getOrdersByVendor: (vendorId: string) => Order[]
  getOrdersByBookingGroup: (bookingGroupId: string) => Order[]
  resetOrders: () => void
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      createCheckoutOrders: async ({
        items,
        products,
        commodities,
        offers,
        vendors,
        customer,
      }) => {
        if (isApiConfigured()) {
          try {
            const dropLat = customer.dropoffLat
            const dropLng = customer.dropoffLng
            if (
              dropLat === null ||
              dropLng === null ||
              !Number.isFinite(dropLat) ||
              !Number.isFinite(dropLng)
            ) {
              return {
                ok: false,
                message: 'Set your drop-off pin before checking out.',
              }
            }

            const branches = useBranchStore.getState().branches
            const vendorDistances: Array<{ vendorId: string; distanceKm: number }> =
              []
            const seenVendors = new Set<string>()

            for (const item of items) {
              const product = products.find((p) => p.id === item.productId)
              const vendor = vendors.find((v) => v.id === item.vendorId)
              if (!product || !vendor) {
                return { ok: false, message: 'Cart has an unknown product.' }
              }
              if (!isVendorAcceptingOrders(vendor)) {
                return {
                  ok: false,
                  message: `${vendor.name} is past cut-off and cannot accept orders.`,
                }
              }
              if (seenVendors.has(vendor.id)) continue
              seenVendors.add(vendor.id)

              const branch = branches.find((b) => b.id === vendor.branchId)
              if (
                !branch ||
                !Number.isFinite(branch.lat) ||
                !Number.isFinite(branch.lng)
              ) {
                return {
                  ok: false,
                  message: `Missing branch coordinates for ${vendor.name}.`,
                }
              }
              vendorDistances.push({
                vendorId: vendor.id,
                distanceKm: Number(
                  distanceKm(dropLat, dropLng, branch.lat, branch.lng).toFixed(2),
                ),
              })
            }

            const created = await checkoutOrders({
              customer,
              items: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
              vendorDistances,
            })
            set({ orders: [...created, ...get().orders.filter((o) => !created.some((c) => c.id === o.id))] })
            return {
              ok: true,
              orders: created,
              bookingGroupId: created[0]?.bookingGroupId ?? '',
            }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error ? error.message : 'Checkout failed.',
            }
          }
        }

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
        let remainder = Number(
          (DELIVERY_FEE - deliveryShare * vendorCount).toFixed(2),
        )

        const bookingGroupId = generateId('BOOK')
        const now = new Date().toISOString()
        const created: Order[] = []
        const branches = useBranchStore.getState().branches

        for (const [vendorId, vendorItems] of groups) {
          const vendor = vendors.find((v) => v.id === vendorId)!
          const branch = branches.find((b) => b.id === vendor.branchId)
          if (!branch || !branch.isActive) {
            return {
              ok: false,
              message: `${vendor.name} has no active palengke / pickup branch.`,
            }
          }
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
            bookingGroupId,
            vendorId,
            vendorName: vendor.name,
            customerName: customer.customerName.trim(),
            contactNumber: customer.contactNumber.trim(),
            deliveryAddress: customer.deliveryAddress.trim(),
            notes: customer.notes?.trim() || undefined,
            items: snapshots,
            subtotal,
            deliveryFee: fee,
            total: Number((subtotal + fee).toFixed(2)),
            status: 'pending_payment',
            branchId: branch.id,
            branchName: branch.name,
            pickupLat: branch.lat,
            pickupLng: branch.lng,
            createdAt: now,
            updatedAt: now,
          })
        }

        set({ orders: [...created, ...get().orders] })
        return { ok: true, orders: created, bookingGroupId }
      },
      submitPayment: async (orderId, transactionReference) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return { ok: false, message: 'Order not found.' }
        const reference =
          transactionReference?.trim() || `TXN-${Date.now().toString(36).toUpperCase()}`

        if (isApiConfigured()) {
          try {
            const result = await submitOrderPayment(orderId, reference)
            const updated: Order = {
              ...order,
              status: result.status,
              transactionReference: reference,
              paymentSubmittedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            set({
              orders: get().orders.map((o) => (o.id === orderId ? updated : o)),
            })
            return { ok: true, order: updated }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to submit payment.',
            }
          }
        }

        try {
          const updated = transitionOrder(order, 'awaiting_vendor_confirmation', {
            transactionReference: reference,
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
      confirmPayment: async (orderId, vendorId) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return { ok: false, message: 'Order not found.' }
        if (order.vendorId !== vendorId) {
          return { ok: false, message: 'You can only confirm your own orders.' }
        }

        const siblings = get().orders.filter(
          (o) => o.bookingGroupId === order.bookingGroupId,
        )
        const allPaid = siblings.every((o) => paidEnoughForConfirm(o.status))
        if (!allPaid) {
          return {
            ok: false,
            message:
              'Cannot confirm yet — customer must finalize payment for all vendors in this booking group.',
          }
        }

        const deductStock = () => {
          const adjustStock = useProductStore.getState().adjustStock
          for (const item of order.items) {
            adjustStock(item.productId, -item.quantity)
          }
        }

        if (isApiConfigured()) {
          try {
            const result = await vendorDecideOrder(orderId, 'confirmed')
            const updated: Order = {
              ...order,
              status: result.status,
              deliveryStatus: result.deliveryStatus ?? 'packing',
              updatedAt: new Date().toISOString(),
            }
            set({
              orders: get().orders.map((o) => (o.id === orderId ? updated : o)),
            })
            deductStock()
            return { ok: true, order: updated }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to confirm payment.',
            }
          }
        }

        try {
          const updated = transitionOrder(order, 'confirmed', {
            deliveryStatus: 'packing',
          })
          set({
            orders: get().orders.map((o) => (o.id === orderId ? updated : o)),
          })
          deductStock()
          return { ok: true, order: updated }
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : 'Unable to confirm payment.',
          }
        }
      },
      advanceDelivery: async (orderId, vendorId) => {
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
          (o) => o.bookingGroupId === order.bookingGroupId,
        )
        const allConfirmed = siblings.every((o) => o.status === 'confirmed')
        if (!allConfirmed) {
          return {
            ok: false,
            message:
              'Keri delivery starts only after all vendor payments in this booking group are confirmed.',
          }
        }

        const current = normalizeDeliveryStatus(order.deliveryStatus)
        const idx = DELIVERY_FLOW.indexOf(current)
        if (idx < 0 || idx >= DELIVERY_FLOW.length - 1) {
          return { ok: false, message: 'Delivery is already complete.' }
        }

        const next = DELIVERY_FLOW[idx + 1]!
        const nowIso = new Date().toISOString()
        let keriTrackingId = order.keriTrackingId
        if (next === 'out_for_delivery') {
          keriTrackingId =
            siblings.find((s) => s.keriTrackingId)?.keriTrackingId ??
            generateId('KERI')
        }

        if (isApiConfigured()) {
          try {
            const result = await advanceOrderDelivery(
              orderId,
              next,
              next === 'out_for_delivery' ? keriTrackingId : undefined,
            )
            set({
              orders: get().orders.map((o) => {
                if (o.bookingGroupId !== order.bookingGroupId) return o
                if (o.id === orderId) {
                  return {
                    ...o,
                    deliveryStatus: result.deliveryStatus ?? next,
                    pickupCode: result.pickupCode ?? o.pickupCode,
                    keriTrackingId:
                      result.keriTrackingId ?? keriTrackingId ?? o.keriTrackingId,
                    updatedAt: nowIso,
                  }
                }
                if (next === 'out_for_delivery' && keriTrackingId) {
                  return { ...o, keriTrackingId, updatedAt: nowIso }
                }
                return o
              }),
            })
            return { ok: true, order: get().orders.find((o) => o.id === orderId)! }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to advance delivery.',
            }
          }
        }

        const pickupCode =
          next === 'ready_for_keri'
            ? order.pickupCode || generatePickupCode()
            : order.pickupCode

        set({
          orders: get().orders.map((o) => {
            if (o.bookingGroupId !== order.bookingGroupId) return o
            if (o.id === orderId) {
              return {
                ...o,
                deliveryStatus: next,
                pickupCode: pickupCode ?? o.pickupCode,
                keriTrackingId:
                  next === 'out_for_delivery' || o.keriTrackingId
                    ? keriTrackingId ?? o.keriTrackingId
                    : o.keriTrackingId,
                updatedAt: nowIso,
              }
            }
            if (next === 'out_for_delivery' && keriTrackingId) {
              return {
                ...o,
                keriTrackingId,
                updatedAt: nowIso,
              }
            }
            return o
          }),
        })

        return { ok: true, order: get().orders.find((o) => o.id === orderId)! }
      },
      rejectPayment: async (orderId, vendorId) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return { ok: false, message: 'Order not found.' }
        if (order.vendorId !== vendorId) {
          return { ok: false, message: 'You can only reject your own orders.' }
        }

        if (isApiConfigured()) {
          try {
            const result = await vendorDecideOrder(orderId, 'payment_rejected')
            const updated: Order = {
              ...order,
              status: result.status,
              updatedAt: new Date().toISOString(),
            }
            set({
              orders: get().orders.map((o) => (o.id === orderId ? updated : o)),
            })
            return { ok: true, order: updated }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to reject payment.',
            }
          }
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
      getOrdersByBookingGroup: (bookingGroupId) =>
        get().orders.filter((o) => o.bookingGroupId === bookingGroupId),
      resetOrders: () => set({ orders: [] }),
    }),
    {
      name: `${STORAGE_PREFIX}-orders`,
      // When the API is connected, orders come from Strapi — don't rehydrate a
      // stale local copy that can overwrite live vendor confirmations.
      partialize: (state) =>
        isApiConfigured() ? {} : { orders: state.orders },
      merge: (persisted, current) => {
        if (isApiConfigured()) {
          return { ...current }
        }
        const p = persisted as Partial<OrderState> | undefined
        const orders = (p?.orders ?? current.orders).map((o) => {
          const legacy = o as Order & { checkoutGroupId?: string }
          return {
            ...o,
            bookingGroupId:
              legacy.bookingGroupId || legacy.checkoutGroupId || o.id,
          }
        })
        return { ...current, ...p, orders }
      },
    },
  ),
)
