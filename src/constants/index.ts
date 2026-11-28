import type {
  DeliveryStatus,
  OfferStatus,
  OrderStatus,
  ProductCategory,
  ProductUnit,
} from '@/types'

export const BRAND_NAME = 'Palengke mo, Keri ko'
export const BRAND_TAGLINE = 'Preskong Pamalengke, Mas Madaling Mamili.'
export const STORAGE_PREFIX = 'paranaque-customerfront-v1'

/** Show an "Only N left" badge at or below this stock level. */
export const LOW_STOCK_THRESHOLD = 5
export const PRICE_DISCLAIMER =
  'Prices may vary. Illustrative LGU price ranges — vendors set their own price within the range.'
/**
 * Offline / no-API fallback only. Live checkout quotes the fee from Keri.
 */
export const DELIVERY_FEE_PLACEHOLDER = 100
/** @deprecated Use DELIVERY_FEE_PLACEHOLDER — kept as alias for existing imports. */
export const DELIVERY_FEE = DELIVERY_FEE_PLACEHOLDER
export const DELIVERY_FEE_NOTE =
  'Delivery fee is quoted from your drop-off pin to the palengke branch.'
export const DELIVERY_FEE_LOADING_NOTE = 'Calculating delivery fee…'
export const DELIVERY_FEE_ERROR_NOTE =
  'Could not calculate delivery fee. Check your pin and try again.'
/** Max cart weight (kg) for one checkout. */
export const MAX_BOOKING_WEIGHT_KG = 25
export const MAX_BOOKING_WEIGHT_MESSAGE = `Total weight must not exceed ${MAX_BOOKING_WEIGHT_KG} kg. Remove some items before continuing.`
/** Units vendors may choose when marking stock. */
export const VENDOR_STOCK_UNITS: Array<'kg' | 'piece'> = ['kg', 'piece']
/**
 * Offer negotiation (Tumawad). Disabled while standard pricing remains
 * the controlled path. Set to `true` to restore the Offers UI.
 */
export const FEATURE_TAWAD_ENABLED = false

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  packing: 'Packing',
  ready_for_keri: 'Ready for Keri',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
}

/** Visual milestones for Keri delivery after payment is confirmed. */
export const DELIVERY_MILESTONES: {
  id: DeliveryStatus
  label: string
  description: string
}[] = [
  {
    id: 'packing',
    label: 'Packing',
    description: 'Vendor is packing your order for pickup by Keri.',
  },
  {
    id: 'ready_for_keri',
    label: 'Ready for Keri',
    description: 'Order is packed and waiting for the Keri rider.',
  },
  {
    id: 'out_for_delivery',
    label: 'Out for delivery',
    description: 'Keri is on the way with your order.',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    description: 'Order handed off — salamat sa pag-order!',
  },
]

export const CATEGORIES: ProductCategory[] = [
  'Vegetables',
  'Fruits',
  'Seafood',
  'Meat',
  'Poultry',
  'Rice and Grains',
  'Eggs and Dairy',
  'Spices and Condiments',
]

export const UNITS: ProductUnit[] = ['kg', 'piece', 'bundle', 'tray', 'pack']

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending Payment',
  awaiting_vendor_confirmation: 'Awaiting Vendor Confirmation',
  confirmed: 'Confirmed',
  payment_rejected: 'Payment Rejected',
  cancelled: 'Cancelled',
}

export const ORDER_STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending_payment:
    'Your order is ready. Complete the QR payment to continue.',
  awaiting_vendor_confirmation:
    'Payment submitted. Waiting for the vendor to verify your payment.',
  confirmed:
    'Payment confirmed by the vendor. Keri delivery is underway — track milestones below.',
  payment_rejected:
    'The vendor could not verify the payment. You may resubmit payment details.',
  cancelled: 'This order has been cancelled.',
}

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['awaiting_vendor_confirmation', 'cancelled'],
  awaiting_vendor_confirmation: ['confirmed', 'payment_rejected', 'cancelled'],
  confirmed: ['cancelled'],
  payment_rejected: ['awaiting_vendor_confirmation', 'cancelled'],
  cancelled: [],
}

export const CATEGORY_ICONS: Record<ProductCategory, string> = {
  Vegetables: 'Leaf',
  Fruits: 'Apple',
  Seafood: 'Fish',
  Meat: 'Beef',
  Poultry: 'Drumstick',
  'Rice and Grains': 'Wheat',
  'Eggs and Dairy': 'Egg',
  'Spices and Condiments': 'Flame',
}

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  pending: 'Pending Vendor Reply',
  accepted: 'Accepted',
  rejected: 'Rejected',
  countered: 'Vendor Counteroffer',
  counter_accepted: 'Counteroffer Accepted',
  counter_declined: 'Counteroffer Declined',
}
