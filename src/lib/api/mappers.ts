import { resolveMediaUrl } from './client'
import type {
  Branch,
  ChatMessage,
  ChatSender,
  ChatThread,
  Commodity,
  DeliveryStatus,
  Order,
  OrderItemSnapshot,
  OrderStatus,
  PriceHistoryEntry,
  Product,
  ProductCategory,
  ProductUnit,
  Vendor,
  VendorUser,
} from '@/types'

export interface StrapiMedia {
  url?: string
  documentId?: string
  name?: string
  mime?: string
}

export type StrapiRelation<T> = T | { documentId?: string; id?: number | string } | null

export interface StrapiBranch {
  documentId: string
  name?: string
  address?: string
  lat?: number | string
  lng?: number | string
  isActive?: boolean
}

export interface StrapiCommodity {
  documentId: string
  name?: string
  description?: string
  category?: ProductCategory
  unit?: ProductUnit
  priceMin?: number | string
  priceMax?: number | string
  imageUrl?: string
  effectiveFrom?: string
  isActive?: boolean
}

export interface StrapiPriceHistory {
  documentId: string
  commodity?: StrapiRelation<StrapiCommodity>
  previousPriceMin?: number | string
  previousPriceMax?: number | string
  newPriceMin?: number | string
  newPriceMax?: number | string
  effectiveFrom?: string
  changedAt?: string
  note?: string
}

export interface StrapiUser {
  documentId: string
  id?: number
  username?: string
  email?: string
  name?: string
  phone?: string
  blocked?: boolean
  role?: { type?: string; name?: string } | null
  ownedVendors?: Array<StrapiRelation<{ documentId?: string }>> | null
}

export interface StrapiVendor {
  documentId: string
  name?: string
  description?: string
  categories?: ProductCategory[] | null
  location?: string
  imageUrl?: string
  isAvailable?: boolean
  opensAt?: string | null
  cutoffTime?: string | null
  rating?: number | string
  demoQrLabel?: string
  paymentQr?: StrapiMedia | null
  branch?: StrapiRelation<StrapiBranch>
  owner?: StrapiRelation<StrapiUser>
}

export interface StrapiProduct {
  documentId: string
  name?: string
  description?: string
  category?: ProductCategory
  unit?: ProductUnit
  vendorPrice?: number | string
  weightKg?: number | string
  stock?: number
  reservedStock?: number
  imageUrl?: string
  isAvailable?: boolean
  isFeatured?: boolean
  isPopular?: boolean
  isArchived?: boolean
  vendor?: StrapiRelation<StrapiVendor>
  commodity?: StrapiRelation<StrapiCommodity>
}

export interface StrapiOrderItem {
  productId?: string
  commodityId?: string
  name?: string
  unit?: ProductUnit
  unitPrice?: number | string
  standardUnitPrice?: number | string
  quantity?: number | string
  lineTotal?: number | string
  imageUrl?: string
  pricingSource?: 'standard' | 'negotiated'
  offerId?: string
}

export interface StrapiOrder {
  documentId: string
  bookingGroupId?: string
  vendorName?: string
  customerName?: string
  contactNumber?: string
  deliveryAddress?: string
  notes?: string
  items?: StrapiOrderItem[]
  subtotal?: number | string
  deliveryFee?: number | string
  distance?: number | string
  total?: number | string
  /** @deprecated Prefer paymentStatus — kept briefly for older API payloads. */
  status?: OrderStatus
  paymentStatus?: OrderStatus
  deliveryStatus?: DeliveryStatus | null
  pickupLat?: number | string
  pickupLng?: number | string
  branchId?: string
  branchName?: string
  transactionReference?: string
  paymentSubmittedAt?: string
  reservationExpiresAt?: string | null
  cancelledBy?: 'customer' | 'vendor' | 'system' | null
  cancelledAt?: string | null
  cancelReason?: string | null
  keriTrackingId?: string
  podUrl?: string | null
  paymentProof?: StrapiMedia | null
  pickupCode?: string
  createdAt?: string
  updatedAt?: string
  vendor?: StrapiRelation<StrapiVendor>
  customer?: StrapiRelation<StrapiUser>
}

export interface StrapiChatThread {
  documentId: string
  customerLabel?: string
  lastMessagePreview?: string
  customerLastReadAt?: string | null
  vendorLastReadAt?: string | null
  createdAt?: string
  updatedAt?: string
  vendor?: StrapiRelation<StrapiVendor>
}

export interface StrapiChatMessage {
  documentId: string
  sender?: ChatSender
  body?: string
  createdAt?: string
  image?: StrapiMedia | null
  thread?: StrapiRelation<StrapiChatThread>
}

function num(value: number | string | null | undefined, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function relationId(value: StrapiRelation<{ documentId?: string }> | undefined): string {
  if (!value || typeof value !== 'object') return ''
  return value.documentId ?? ''
}

/** Normalizes API time values to `HH:mm`. */
export function normalizeTime(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback
  const match = /^(\d{2}):(\d{2})/.exec(value)
  return match ? `${match[1]}:${match[2]}` : fallback
}

export function mapBranch(raw: StrapiBranch): Branch {
  return {
    id: raw.documentId,
    name: raw.name ?? '',
    address: raw.address ?? '',
    lat: num(raw.lat),
    lng: num(raw.lng),
    isActive: raw.isActive ?? true,
  }
}

export function mapCommodity(raw: StrapiCommodity): Commodity {
  return {
    id: raw.documentId,
    name: raw.name ?? '',
    description: raw.description ?? '',
    category: (raw.category ?? 'Vegetables') as ProductCategory,
    unit: (raw.unit ?? 'kg') as ProductUnit,
    priceMin: num(raw.priceMin),
    priceMax: num(raw.priceMax),
    imageUrl: resolveMediaUrl(raw.imageUrl),
    effectiveFrom: raw.effectiveFrom ?? new Date().toISOString().slice(0, 10),
    isActive: raw.isActive ?? true,
  }
}

export function mapPriceHistory(raw: StrapiPriceHistory): PriceHistoryEntry {
  return {
    id: raw.documentId,
    commodityId: relationId(raw.commodity),
    previousPriceMin: num(raw.previousPriceMin),
    previousPriceMax: num(raw.previousPriceMax),
    newPriceMin: num(raw.newPriceMin),
    newPriceMax: num(raw.newPriceMax),
    effectiveFrom: raw.effectiveFrom ?? '',
    changedAt: raw.changedAt ?? '',
    note: raw.note || undefined,
  }
}

export function mapVendorUser(raw: StrapiUser): VendorUser {
  return {
    id: raw.documentId,
    name: raw.name?.trim() || raw.username || raw.email || 'Vendor user',
    email: (raw.email ?? '').toLowerCase(),
    phone: raw.phone ?? '',
    password: '',
    isActive: !(raw.blocked ?? false),
  }
}

function mapPaymentQrLabel(raw?: string | null): string {
  const cleaned = (raw ?? '').replace(/\bDEMO\s+/gi, '').trim()
  return cleaned || 'Payment QR'
}

export function mapVendor(raw: StrapiVendor): Vendor {
  return {
    id: raw.documentId,
    name: raw.name ?? '',
    description: raw.description ?? '',
    categories: Array.isArray(raw.categories) ? raw.categories : [],
    location: raw.location ?? '',
    branchId: relationId(raw.branch),
    imageUrl: raw.imageUrl ?? '',
    isAvailable: raw.isAvailable ?? true,
    opensAt: normalizeTime(raw.opensAt, '05:00'),
    cutoffTime: normalizeTime(raw.cutoffTime, '17:00'),
    rating: num(raw.rating, 0),
    // seed still stores demoQrLabel with a DEMO prefix — don't show that
    qrLabel: mapPaymentQrLabel(raw.demoQrLabel),
    paymentQrUrl: resolveMediaUrl(raw.paymentQr?.url),
    ownerUserId: relationId(raw.owner),
  }
}

export function mapProduct(raw: StrapiProduct): Product {
  return {
    id: raw.documentId,
    vendorId: relationId(raw.vendor),
    commodityId: relationId(raw.commodity),
    name: raw.name ?? '',
    description: raw.description ?? '',
    category: (raw.category ?? 'Vegetables') as ProductCategory,
    unit: (raw.unit ?? 'kg') as ProductUnit,
    vendorPrice: num(raw.vendorPrice),
    weightKg: num(raw.weightKg),
    stock: Math.max(0, Math.trunc(num(raw.stock))),
    reservedStock: Math.max(0, Math.trunc(num(raw.reservedStock))),
    imageUrl: resolveMediaUrl(raw.imageUrl),
    isAvailable: raw.isAvailable ?? true,
    isFeatured: raw.isFeatured ?? false,
    isPopular: raw.isPopular ?? false,
    isArchived: raw.isArchived ?? false,
  }
}

function mapOrderItem(raw: StrapiOrderItem): OrderItemSnapshot {
  return {
    productId: raw.productId ?? '',
    commodityId: raw.commodityId || undefined,
    name: raw.name ?? '',
    unit: (raw.unit ?? 'kg') as ProductUnit,
    unitPrice: num(raw.unitPrice),
    standardUnitPrice: num(raw.standardUnitPrice),
    quantity: num(raw.quantity, 1),
    lineTotal: num(raw.lineTotal),
    imageUrl: resolveMediaUrl(raw.imageUrl),
    pricingSource: raw.pricingSource === 'negotiated' ? 'negotiated' : 'standard',
    offerId: raw.offerId || undefined,
  }
}

export function mapOrder(raw: StrapiOrder): Order {
  return {
    id: raw.documentId,
    bookingGroupId: raw.bookingGroupId || raw.documentId,
    vendorId: relationId(raw.vendor),
    vendorName: raw.vendorName ?? '',
    customerName: raw.customerName ?? '',
    contactNumber: raw.contactNumber ?? '',
    deliveryAddress: raw.deliveryAddress ?? '',
    notes: raw.notes || undefined,
    items: (raw.items ?? []).map(mapOrderItem),
    subtotal: num(raw.subtotal),
    deliveryFee: num(raw.deliveryFee),
    distanceKm:
      raw.distance === undefined || raw.distance === null
        ? undefined
        : num(raw.distance),
    total: num(raw.total),
    status: (raw.paymentStatus ?? raw.status ?? 'pending_payment') as OrderStatus,
    deliveryStatus: raw.deliveryStatus ?? undefined,
    pickupLat: num(raw.pickupLat),
    pickupLng: num(raw.pickupLng),
    branchId: raw.branchId ?? '',
    branchName: raw.branchName ?? '',
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    transactionReference: raw.transactionReference || undefined,
    paymentSubmittedAt: raw.paymentSubmittedAt || undefined,
    reservationExpiresAt: raw.reservationExpiresAt || undefined,
    cancelledBy:
      raw.cancelledBy === 'customer' ||
      raw.cancelledBy === 'vendor' ||
      raw.cancelledBy === 'system'
        ? raw.cancelledBy
        : undefined,
    cancelledAt: raw.cancelledAt || undefined,
    cancelReason: raw.cancelReason || undefined,
    keriTrackingId: raw.keriTrackingId || undefined,
    podUrl: raw.podUrl?.trim() || undefined,
    paymentProofUrl: resolveMediaUrl(raw.paymentProof?.url) || undefined,
    pickupCode: raw.pickupCode || undefined,
  }
}

export function mapChatThread(raw: StrapiChatThread): ChatThread {
  return {
    id: raw.documentId,
    vendorId: relationId(raw.vendor),
    customerLabel: raw.customerLabel ?? 'Customer',
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    lastMessagePreview: raw.lastMessagePreview ?? '',
    customerLastReadAt: raw.customerLastReadAt ?? '',
    vendorLastReadAt: raw.vendorLastReadAt ?? '',
  }
}

export function mapChatMessage(raw: StrapiChatMessage): ChatMessage {
  return {
    id: raw.documentId,
    threadId: relationId(raw.thread),
    sender: raw.sender === 'vendor' ? 'vendor' : 'customer',
    body: raw.body ?? '',
    imageUrl: resolveMediaUrl(raw.image?.url) || undefined,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  }
}
