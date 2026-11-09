import { endOfDay, startOfDay } from '@/lib/report'
import type { Order, OrderStatus } from '@/types'

export type StatusFilter = 'all' | OrderStatus

export interface OrderFilters {
  status: StatusFilter
  /** `'all'` or a vendor id. */
  vendorId: string
  /** `'all'` or a branch id. */
  branchId: string
  from?: Date | null
  to?: Date | null
  query?: string
}

export function filterOrders(orders: Order[], f: OrderFilters): Order[] {
  const q = (f.query ?? '').trim().toLowerCase()
  const from = f.from?.getTime()
  const to = f.to?.getTime()
  return orders.filter((o) => {
    if (f.status !== 'all' && o.status !== f.status) return false
    if (f.vendorId !== 'all' && o.vendorId !== f.vendorId) return false
    if (f.branchId !== 'all' && o.branchId !== f.branchId) return false
    const t = new Date(o.createdAt).getTime()
    if (from !== undefined && t < from) return false
    if (to !== undefined && t > to) return false
    if (!q) return true
    return (
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.vendorName.toLowerCase().includes(q) ||
      (o.keriTrackingId ?? '').toLowerCase().includes(q) ||
      (o.bookingGroupId ?? '').toLowerCase().includes(q)
    )
  })
}

export type PeriodPreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'month'

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
]

/** Resolve a preset to a concrete range (`null` = unbounded). */
export function resolvePeriod(
  preset: PeriodPreset,
  now: Date = new Date(),
): { from: Date | null; to: Date | null } {
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) }
    case 'yesterday': {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      return { from: startOfDay(y), to: endOfDay(y) }
    }
    case 'last7': {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
      return { from: startOfDay(s), to: endOfDay(now) }
    }
    case 'month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        to: endOfDay(now),
      }
    default:
      return { from: null, to: null }
  }
}
