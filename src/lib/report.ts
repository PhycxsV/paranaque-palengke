import { DELIVERY_STATUS_LABELS, ORDER_STATUS_LABELS } from '@/constants'
import type { Order, Vendor, VendorFeedback } from '@/types'

export type CellStyle = 'money' | 'bold' | 'boldMoney' | 'title' | 'header'

export interface StyledCell {
  v: string | number | null
  s?: CellStyle
}

export type Cell = string | number | null | StyledCell

export interface ReportSheet {
  name: string
  rows: Cell[][]
}

export interface ReportInput {
  orders: Order[]
  vendors: Vendor[]
  feedback: VendorFeedback[]
  from: Date
  to: Date
  generatedAt: Date
  /** Human readable description of the active filters. */
  filtersLabel: string
}

export interface ReportResult {
  sheets: ReportSheet[]
  /** Flat orders table used for CSV (header + rows). */
  ordersTable: { header: string[]; rows: (string | number)[][] }
  totals: ReportTotals
}

export interface ReportTotals {
  orders: number
  confirmed: number
  awaitingConfirmation: number
  pendingPayment: number
  rejected: number
  confirmedSubtotal: number
  confirmedDeliveryFees: number
  confirmedGross: number
  delivered: number
  outForDelivery: number
  preparing: number
}

const pad = (n: number) => String(n).padStart(2, '0')

/** `YYYY-MM-DD HH:mm` in the viewer's local time. */
export function formatStamp(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Local `YYYY-MM-DDTHH:mm` for `<input type="datetime-local">`. */
export function toLocalInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function parseLocalInput(value: string): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

export function isWithinRange(iso: string, from: Date, to: Date): boolean {
  const t = new Date(iso).getTime()
  return t >= from.getTime() && t <= to.getTime()
}

export function computeTotals(orders: Order[]): ReportTotals {
  const confirmed = orders.filter((o) => o.status === 'confirmed')
  const sum = (list: Order[], pick: (o: Order) => number) =>
    Number(list.reduce((acc, o) => acc + pick(o), 0).toFixed(2))
  return {
    orders: orders.length,
    confirmed: confirmed.length,
    awaitingConfirmation: orders.filter(
      (o) => o.status === 'awaiting_vendor_confirmation',
    ).length,
    pendingPayment: orders.filter((o) => o.status === 'pending_payment').length,
    rejected: orders.filter((o) => o.status === 'payment_rejected').length,
    confirmedSubtotal: sum(confirmed, (o) => o.subtotal),
    confirmedDeliveryFees: sum(confirmed, (o) => o.deliveryFee ?? 0),
    confirmedGross: sum(confirmed, (o) => o.total),
    delivered: confirmed.filter((o) => o.deliveryStatus === 'delivered').length,
    outForDelivery: confirmed.filter(
      (o) => o.deliveryStatus === 'out_for_delivery',
    ).length,
    preparing: confirmed.filter(
      (o) => !o.deliveryStatus || o.deliveryStatus === 'awaiting_pickup',
    ).length,
  }
}

const ORDER_HEADER = [
  'Order ID',
  'Placed',
  'Customer',
  'Contact',
  'Vendor',
  'Palengke',
  'Items',
  'Subtotal (PHP)',
  'Delivery fee (PHP)',
  'Total (PHP)',
  'Status',
  'Keri delivery',
  'Keri tracking ID',
  'Booking group',
  'Transaction ref',
  'Payment submitted',
  'Notes',
]

function orderRow(o: Order): (string | number)[] {
  return [
    o.id,
    formatStamp(o.createdAt),
    o.customerName,
    o.contactNumber,
    o.vendorName,
    o.branchName,
    o.items.length,
    o.subtotal,
    o.deliveryFee ?? 0,
    o.total,
    ORDER_STATUS_LABELS[o.status],
    o.status === 'confirmed'
      ? DELIVERY_STATUS_LABELS[o.deliveryStatus ?? 'awaiting_pickup']
      : '',
    o.keriTrackingId ?? '',
    o.bookingGroupId,
    o.transactionReference ?? '',
    o.paymentSubmittedAt ? formatStamp(o.paymentSubmittedAt) : '',
    o.notes ?? '',
  ]
}

export function buildReport(input: ReportInput): ReportResult {
  const { orders, vendors, feedback, from, to, generatedAt, filtersLabel } = input
  const sorted = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const totals = computeTotals(sorted)
  const feedbackInRange = feedback
    .filter((f) => isWithinRange(f.createdAt, from, to))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const money = (v: number): Cell => ({ v, s: 'money' })
  const label = (v: string): Cell => ({ v, s: 'bold' })

  // ---- Summary ----
  const summary: Cell[][] = [
    [{ v: 'Palengke mo, Keri ko — End of Day Report', s: 'title' }],
    [],
    [label('Period from'), formatStamp(from)],
    [label('Period to'), formatStamp(to)],
    [label('Generated'), formatStamp(generatedAt)],
    [label('Filters'), filtersLabel],
    [],
    [{ v: 'Orders', s: 'header' }, { v: 'Count', s: 'header' }],
    ['Total orders placed', totals.orders],
    ['Confirmed', totals.confirmed],
    ['Awaiting vendor confirmation', totals.awaitingConfirmation],
    ['Pending payment', totals.pendingPayment],
    ['Payment rejected', totals.rejected],
    [],
    [{ v: 'Keri delivery (confirmed orders)', s: 'header' }, { v: 'Count', s: 'header' }],
    ['Preparing for Keri', totals.preparing],
    ['Out for delivery', totals.outForDelivery],
    ['Delivered', totals.delivered],
    [],
    [{ v: 'Sales (confirmed orders only)', s: 'header' }, { v: 'PHP', s: 'header' }],
    ['Goods subtotal', money(totals.confirmedSubtotal)],
    ['Delivery fees (placeholder)', money(totals.confirmedDeliveryFees)],
    [label('Gross total'), { v: totals.confirmedGross, s: 'boldMoney' }],
    [],
    [
      { v: 'Vendor', s: 'header' },
      { v: 'Palengke', s: 'header' },
      { v: 'Orders', s: 'header' },
      { v: 'Confirmed', s: 'header' },
      { v: 'Rejected', s: 'header' },
      { v: 'Open', s: 'header' },
      { v: 'Confirmed sales (PHP)', s: 'header' },
      { v: 'Feedback', s: 'header' },
      { v: 'Avg rating', s: 'header' },
    ],
  ]

  for (const vendor of vendors) {
    const own = sorted.filter((o) => o.vendorId === vendor.id)
    const fb = feedbackInRange.filter((f) => f.vendorId === vendor.id)
    if (own.length === 0 && fb.length === 0) continue
    const t = computeTotals(own)
    const avg = fb.length ? fb.reduce((a, f) => a + f.rating, 0) / fb.length : null
    summary.push([
      vendor.name,
      own[0]?.branchName ?? '',
      own.length,
      t.confirmed,
      t.rejected,
      t.pendingPayment + t.awaitingConfirmation,
      money(t.confirmedGross),
      fb.length,
      avg === null ? '' : Number(avg.toFixed(2)),
    ])
  }

  // ---- Orders ----
  const orderRows = sorted.map(orderRow)
  const ordersSheet: Cell[][] = [
    ORDER_HEADER.map((v): Cell => ({ v, s: 'header' })),
    ...orderRows.map((row) =>
      row.map((v, c): Cell =>
        // Columns 7–9 (Subtotal, Delivery fee, Total) are money.
        c >= 7 && c <= 9 ? { v, s: 'money' } : v,
      ),
    ),
  ]

  // ---- Line items ----
  const itemsSheet: Cell[][] = [
    ['Order ID', 'Placed', 'Vendor', 'Product', 'Qty', 'Unit', 'Unit price (PHP)', 'Line total (PHP)', 'Pricing'].map(
      (v): Cell => ({ v, s: 'header' }),
    ),
  ]
  for (const o of sorted) {
    for (const item of o.items) {
      itemsSheet.push([
        o.id,
        formatStamp(o.createdAt),
        o.vendorName,
        item.name,
        item.quantity,
        item.unit,
        money(item.unitPrice),
        money(item.lineTotal),
        item.pricingSource === 'negotiated' ? 'Negotiated' : 'Standard',
      ])
    }
  }

  // ---- Feedback ----
  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? id
  const feedbackSheet: Cell[][] = [
    ['Date', 'Vendor', 'Customer', 'Rating (1-5)', 'Comment', 'Order ID'].map(
      (v): Cell => ({ v, s: 'header' }),
    ),
    ...feedbackInRange
      .filter((f) => vendors.some((v) => v.id === f.vendorId))
      .map((f): Cell[] => [
        formatStamp(f.createdAt),
        vendorName(f.vendorId),
        f.customerName,
        f.rating,
        f.comment,
        f.orderId ?? '',
      ]),
  ]

  return {
    sheets: [
      { name: 'Summary', rows: summary },
      { name: 'Orders', rows: ordersSheet },
      { name: 'Line items', rows: itemsSheet },
      { name: 'Feedback', rows: feedbackSheet },
    ],
    ordersTable: { header: ORDER_HEADER, rows: orderRows },
    totals,
  }
}

/** File-name friendly range, e.g. `2026-11-09_0000_to_2026-11-09_2359`. */
export function rangeSlug(from: Date, to: Date): string {
  const f = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
  return `${f(from)}_to_${f(to)}`
}
