import type {
  DeliveryStatus,
  OfferStatus,
  OrderStatus,
  ProductCategory,
  ProductUnit,
} from '@/types'

export const BRAND_NAME = 'Palengke mo, Keri ko'
export const BRAND_TAGLINE = 'Preskong Pamalengke, Mas Madaling Mamili.'
export const STORAGE_PREFIX = 'paranaque-palengke-v7'
export const PRICE_DISCLAIMER =
  'Illustrative LGU price ranges — vendors set their own price within the range.'
/** Flat delivery fee (Keri) included in QRPH / demo QR payment total. */
export const DELIVERY_FEE = 100
/** Units vendors may choose when marking stock. */
export const VENDOR_STOCK_UNITS: Array<'kg' | 'piece'> = ['kg', 'piece']
/**
 * Tumawad / offer negotiation. Hidden for now — LGU feedback that
 * negotiated prices may destabilize controlled standard pricing.
 * Set true to restore Offers UI without deleting the feature code.
 */
export const FEATURE_TAWAD_ENABLED = false

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  awaiting_pickup: 'Preparing for Keri',
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
    id: 'awaiting_pickup',
    label: 'Preparing for Keri',
    description: 'Vendor is packing your order for pickup by Keri.',
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
}

export const ORDER_STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending_payment:
    'Your order is ready. Complete the demo QR payment to continue.',
  awaiting_vendor_confirmation:
    'Payment submitted. Waiting for the vendor to verify your demo payment.',
  confirmed:
    'Payment confirmed by the vendor. Keri delivery is underway — track milestones below.',
  payment_rejected:
    'The vendor could not verify the payment. You may resubmit demo payment details.',
}

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['awaiting_vendor_confirmation'],
  awaiting_vendor_confirmation: ['confirmed', 'payment_rejected'],
  confirmed: [],
  payment_rejected: ['awaiting_vendor_confirmation'],
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
