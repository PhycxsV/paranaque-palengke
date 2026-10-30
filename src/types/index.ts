export type ProductCategory =
  | 'Vegetables'
  | 'Fruits'
  | 'Seafood'
  | 'Meat'
  | 'Poultry'
  | 'Rice and Grains'
  | 'Eggs and Dairy'
  | 'Spices and Condiments'

export type ProductUnit = 'kg' | 'piece' | 'bundle' | 'tray' | 'pack'

export type OrderStatus =
  | 'pending_payment'
  | 'awaiting_vendor_confirmation'
  | 'confirmed'
  | 'payment_rejected'

export type DeliveryStatus = 'awaiting_pickup' | 'out_for_delivery' | 'delivered'

export type OfferStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'countered'
  | 'counter_accepted'
  | 'counter_declined'

export type DemoRole = 'customer' | 'vendor' | 'admin'

export interface Commodity {
  id: string
  name: string
  description: string
  category: ProductCategory
  /** Suggested default unit — vendors may override with kg or piece. */
  unit: ProductUnit
  /** LGU guidance — lowest allowed vendor-declared price. */
  priceMin: number
  /** LGU guidance — highest allowed vendor-declared price. */
  priceMax: number
  imageUrl: string
  effectiveFrom: string
  isActive: boolean
}

export interface PriceHistoryEntry {
  id: string
  commodityId: string
  previousPriceMin: number
  previousPriceMax: number
  newPriceMin: number
  newPriceMax: number
  effectiveFrom: string
  changedAt: string
  note?: string
}

export interface Vendor {
  id: string
  name: string
  description: string
  categories: ProductCategory[]
  location: string
  imageUrl: string
  isAvailable: boolean
  /** Daily open time in 24h `HH:mm` (local). */
  opensAt: string
  /** Order cut-off in 24h `HH:mm` (local). Past this, vendor is closed for new orders. */
  cutoffTime: string
  isDemo: true
  demoQrLabel: string
}

/** Vendor listing of an LGU commodity. Selling price is vendor-declared within range. */
export interface Product {
  id: string
  vendorId: string
  commodityId: string
  name: string
  description: string
  category: ProductCategory
  unit: ProductUnit
  /** Vendor-declared unit price (must sit inside commodity priceMin–priceMax). */
  vendorPrice: number
  stock: number
  imageUrl: string
  isAvailable: boolean
  isFeatured?: boolean
  isPopular?: boolean
  isArchived?: boolean
}

export interface CartItem {
  productId: string
  vendorId: string
  quantity: number
  /** When set, checkout uses the negotiated unit price from this accepted offer. */
  acceptedOfferId?: string
}

export interface Offer {
  id: string
  productId: string
  vendorId: string
  commodityId: string
  productName: string
  quantity: number
  unit: ProductUnit
  /** Midpoint / reference LGU range snapshot when the offer was created. */
  standardUnitPriceSnapshot: number
  proposedUnitPrice: number
  counterUnitPrice?: number
  status: OfferStatus
  customerLabel: string
  createdAt: string
  updatedAt: string
  note?: string
}

export interface OrderItemSnapshot {
  productId: string
  commodityId?: string
  name: string
  unit: ProductUnit
  unitPrice: number
  standardUnitPrice: number
  quantity: number
  lineTotal: number
  imageUrl: string
  pricingSource: 'standard' | 'negotiated'
  offerId?: string
}

export interface Order {
  id: string
  /** Shared id for all vendor orders created in one checkout. */
  checkoutGroupId: string
  vendorId: string
  vendorName: string
  customerName: string
  contactNumber: string
  notes?: string
  items: OrderItemSnapshot[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  /** Set when payment is confirmed — tracks Keri delivery progress. */
  deliveryStatus?: DeliveryStatus
  createdAt: string
  updatedAt: string
  transactionReference?: string
  paymentSubmittedAt?: string
}

export interface CommodityFormInput {
  name: string
  description: string
  category: ProductCategory
  unit: ProductUnit
  priceMin: number
  priceMax: number
  imageUrl: string
  isActive: boolean
}

export interface ProductFormInput {
  commodityId: string
  name: string
  description: string
  category: ProductCategory
  unit: ProductUnit
  vendorPrice: number
  stock: number
  imageUrl: string
  isAvailable: boolean
}

export interface VendorProfileInput {
  name: string
  description: string
  location: string
  isAvailable: boolean
  opensAt: string
  cutoffTime: string
}

export interface VendorCreateInput {
  name: string
  description: string
  location: string
  categories: ProductCategory[]
  imageUrl: string
  isAvailable: boolean
  opensAt: string
  cutoffTime: string
  demoQrLabel: string
}

export interface CheckoutFormInput {
  customerName: string
  contactNumber: string
  notes?: string
}

export interface OfferFormInput {
  productId: string
  quantity: number
  proposedUnitPrice: number
  customerLabel?: string
  note?: string
}

export type ChatSender = 'customer' | 'vendor'

export interface ChatThread {
  id: string
  vendorId: string
  customerLabel: string
  createdAt: string
  updatedAt: string
  lastMessagePreview: string
  /** ISO timestamp — customer has read messages up to this time. */
  customerLastReadAt: string
  /** ISO timestamp — vendor has read messages up to this time. */
  vendorLastReadAt: string
}

export interface ChatMessage {
  id: string
  threadId: string
  sender: ChatSender
  body: string
  createdAt: string
}
