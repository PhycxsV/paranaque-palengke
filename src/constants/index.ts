import type {
  OfferStatus,
  OrderStatus,
  ProductCategory,
  ProductUnit,
} from '@/types'

export const BRAND_NAME = 'Parañaque Palengke'
export const BRAND_TAGLINE = 'Preskong Pamalengke, Mas Madaling Mamili.'
export const STORAGE_PREFIX = 'paranaque-palengke-v5'
export const PRICE_DISCLAIMER =
  'Illustrative demo prices — not official Parañaque LGU market rates.'

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
  confirmed: 'Payment confirmed by the vendor. Salamat sa pag-order!',
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
