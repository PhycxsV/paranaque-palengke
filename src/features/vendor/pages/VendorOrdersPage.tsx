import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList, Search, Truck } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterTabs, type FilterTabItem } from '@/components/shared/FilterTabs'
import { PortalHeader } from '@/components/shared/PortalHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DELIVERY_STATUS_LABELS, ORDER_STATUS_LABELS } from '@/constants'
import { cn, formatDateTime, formatPeso } from '@/lib/utils'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useOrderStore } from '@/stores/order-store'
import type { Order, OrderStatus } from '@/types'

type FilterTab = 'all' | OrderStatus

const TAB_DEFS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'awaiting_vendor_confirmation', label: 'Awaiting confirmation' },
  { value: 'pending_payment', label: ORDER_STATUS_LABELS.pending_payment },
  { value: 'confirmed', label: ORDER_STATUS_LABELS.confirmed },
  { value: 'payment_rejected', label: ORDER_STATUS_LABELS.payment_rejected },
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function itemSummary(order: Order) {
  const first = order.items[0]
  if (!first) return 'No items'
  const rest = order.items.length - 1
  return rest > 0 ? `${first.name} +${rest} more` : first.name
}

export default function VendorOrdersPage() {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const getOrdersByVendor = useOrderStore((s) => s.getOrdersByVendor)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [query, setQuery] = useState('')

  const vendorOrders = useMemo<Order[]>(
    () => getOrdersByVendor(activeVendorId),
    [getOrdersByVendor, activeVendorId],
  )

  const tabs = useMemo<FilterTabItem<FilterTab>[]>(
    () =>
      TAB_DEFS.map((tab) => ({
        ...tab,
        count:
          tab.value === 'all'
            ? vendorOrders.length
            : vendorOrders.filter((o) => o.status === tab.value).length,
      })),
    [vendorOrders],
  )

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vendorOrders.filter((o) => {
      if (activeTab !== 'all' && o.status !== activeTab) return false
      if (!q) return true
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.keriTrackingId ?? '').toLowerCase().includes(q)
      )
    })
  }, [vendorOrders, activeTab, query])

  return (
    <div className="space-y-6">
      <PortalHeader
        eyebrow="Vendor portal"
        title="Orders"
        description="Confirm payments, track Keri deliveries and review past orders."
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs items={tabs} value={activeTab} onChange={setActiveTab} />
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order, customer, tracking…"
            className="pl-10"
            aria-label="Search orders"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders found"
          description={
            vendorOrders.length === 0
              ? 'You have no orders yet. Orders will appear here when customers check out.'
              : 'Nothing matches this filter. Try another status or clear the search.'
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)] md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gradient-to-r from-primary-50/80 to-transparent text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Placed</th>
                  <th className="px-4 py-3.5 text-right">Total</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="w-10 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="group relative transition hover:bg-primary-50/50"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-deep">
                          {initials(order.customerName) || '?'}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-primary-deep">
                            {order.customerName}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {itemSummary(order)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/vendor/orders/${order.id}`}
                        className="font-mono text-xs font-semibold text-primary before:absolute before:inset-0"
                      >
                        {order.id}
                      </Link>
                      {order.keriTrackingId ? (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                          <Truck className="h-3 w-3" />
                          {order.keriTrackingId}
                        </p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-primary-deep">
                      {formatPeso(order.total)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {filteredOrders.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/vendor/orders/${order.id}`}
                  className="hover-lift block rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-deep">
                      {initials(order.customerName) || '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-primary-deep">
                        {order.customerName}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {itemSummary(order)}
                      </p>
                    </div>
                    <p className="text-base font-extrabold text-primary-deep">
                      {formatPeso(order.total)}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <StatusBadge status={order.status} />
                    {order.status === 'confirmed' ? (
                      <Badge variant="bay">
                        <Truck className="h-3 w-3" />
                        {DELIVERY_STATUS_LABELS[order.deliveryStatus ?? 'awaiting_pickup']}
                      </Badge>
                    ) : null}
                    <span className={cn('font-mono text-[11px] text-muted')}>
                      {order.id}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
