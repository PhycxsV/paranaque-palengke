import { useMemo, useState } from 'react'
import {
  Ban,
  ClipboardList,
  Download,
  Hourglass,
  Search,
  Truck,
  Wallet,
  X,
} from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterTabs, type FilterTabItem } from '@/components/shared/FilterTabs'
import { PortalHeader } from '@/components/shared/PortalHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DELIVERY_STATUS_LABELS, ORDER_STATUS_LABELS } from '@/constants'
import {
  filterOrders,
  PERIOD_PRESETS,
  resolvePeriod,
  type PeriodPreset,
  type StatusFilter,
} from '@/lib/order-filters'
import { computeTotals } from '@/lib/report'
import { formatDateTime, formatPeso } from '@/lib/utils'
import { useBranchStore } from '@/stores/branch-store'
import { useOrderStore } from '@/stores/order-store'
import { useVendorStore } from '@/stores/vendor-store'
import type { Order } from '@/types'
import { ExportReportDialog } from '../components/ExportReportDialog'

const TAB_DEFS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'awaiting_vendor_confirmation', label: 'Awaiting confirmation' },
  { value: 'pending_payment', label: ORDER_STATUS_LABELS.pending_payment },
  { value: 'confirmed', label: ORDER_STATUS_LABELS.confirmed },
  { value: 'payment_rejected', label: ORDER_STATUS_LABELS.payment_rejected },
]

function itemSummary(order: Order) {
  const first = order.items[0]
  if (!first) return 'No items'
  const rest = order.items.length - 1
  return rest > 0 ? `${first.name} +${rest} more` : first.name
}

export default function AdminOrdersPage() {
  const orders = useOrderStore((s) => s.orders)
  const vendors = useVendorStore((s) => s.vendors)
  const branches = useBranchStore((s) => s.branches)

  const [status, setStatus] = useState<StatusFilter>('all')
  const [vendorId, setVendorId] = useState('all')
  const [branchId, setBranchId] = useState('all')
  const [period, setPeriod] = useState<PeriodPreset>('all')
  const [query, setQuery] = useState('')
  const [exportOpen, setExportOpen] = useState(false)

  const visibleVendors =
    branchId === 'all' ? vendors : vendors.filter((v) => v.branchId === branchId)

  // Everything except the status tab, so the tab counts reflect the other filters.
  const range = useMemo(() => resolvePeriod(period), [period])
  const base = useMemo(
    () =>
      filterOrders(orders, {
        status: 'all',
        vendorId,
        branchId,
        from: range.from,
        to: range.to,
        query,
      }),
    [orders, vendorId, branchId, range, query],
  )
  const filtered = useMemo(
    () => (status === 'all' ? base : base.filter((o) => o.status === status)),
    [base, status],
  )
  const totals = useMemo(() => computeTotals(filtered), [filtered])

  const tabs = useMemo<FilterTabItem<StatusFilter>[]>(
    () =>
      TAB_DEFS.map((tab) => ({
        ...tab,
        count:
          tab.value === 'all'
            ? base.length
            : base.filter((o) => o.status === tab.value).length,
      })),
    [base],
  )

  const hasActiveFilters =
    status !== 'all' ||
    vendorId !== 'all' ||
    branchId !== 'all' ||
    period !== 'all' ||
    query.trim() !== ''

  function clearFilters() {
    setStatus('all')
    setVendorId('all')
    setBranchId('all')
    setPeriod('all')
    setQuery('')
  }

  return (
    <div className="space-y-6">
      <PortalHeader
        eyebrow="LGU Admin"
        title="All orders"
        description="Monitor marketplace orders across every palengke, filter them and export an end-of-day report."
        actions={
          <Button onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" />
            Export report
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Orders shown"
          value={filtered.length}
          icon={ClipboardList}
          tone="primary"
          hint={hasActiveFilters ? `of ${orders.length} total` : 'all time'}
        />
        <StatCard
          label="Confirmed sales"
          value={formatPeso(totals.confirmedGross)}
          icon={Wallet}
          tone="lime"
          hint={`${totals.confirmed} confirmed`}
        />
        <StatCard
          label="Awaiting vendor"
          value={totals.awaitingConfirmation}
          icon={Hourglass}
          tone="gold"
          hint="payment to confirm"
        />
        <StatCard
          label="Rejected"
          value={totals.rejected}
          icon={Ban}
          tone="danger"
          hint="payment rejected"
        />
      </div>

      <div className="space-y-3">
        <FilterTabs items={tabs} value={status} onChange={setStatus} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order, customer, vendor, tracking…"
              className="pl-10"
              aria-label="Search orders"
            />
          </div>

          <Select
            value={branchId}
            onValueChange={(value) => {
              setBranchId(value)
              if (
                value !== 'all' &&
                vendors.find((v) => v.id === vendorId)?.branchId !== value
              ) {
                setVendorId('all')
              }
            }}
          >
            <SelectTrigger aria-label="Filter by palengke">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All palengkes</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={vendorId} onValueChange={setVendorId}>
            <SelectTrigger aria-label="Filter by vendor">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vendors</SelectItem>
              {visibleVendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as PeriodPreset)}
          >
            <SelectTrigger aria-label="Filter by date">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters ? (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="h-11 justify-self-start"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders found"
          description={
            orders.length === 0
              ? 'Orders will appear here once customers place them.'
              : 'Nothing matches these filters. Try widening them or clear all filters.'
          }
          actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
          onAction={hasActiveFilters ? clearFilters : undefined}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)] md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gradient-to-r from-primary-50/80 to-transparent text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                  <th className="px-5 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Vendor</th>
                  <th className="px-4 py-3.5">Palengke</th>
                  <th className="px-4 py-3.5 text-right">Total</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => (
                  <tr key={order.id} className="transition hover:bg-primary-50/50">
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <p className="font-mono text-xs font-semibold text-primary">
                        {order.id}
                      </p>
                      <p className="mt-0.5 max-w-[11rem] truncate text-xs text-muted">
                        {itemSummary(order)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-primary-deep">
                      <p className="whitespace-nowrap">{order.customerName}</p>
                      <p className="mt-0.5 max-w-[14rem] truncate text-xs font-normal text-muted">
                        {order.deliveryAddress || 'No drop-off address'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                      {order.vendorName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                      {order.branchName ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-extrabold text-primary-deep">
                      {formatPeso(order.total)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={order.status} />
                        {order.status === 'confirmed' ? (
                          <Badge variant="bay">
                            <Truck className="h-3 w-3" />
                            {DELIVERY_STATUS_LABELS[order.deliveryStatus ?? 'awaiting_pickup']}
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {filtered.map((order) => (
              <li
                key={order.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-primary-deep">
                      {order.customerName}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {order.vendorName}
                      {order.branchName ? ` · ${order.branchName}` : ''}
                    </p>
                  </div>
                  <p className="text-base font-extrabold text-primary-deep">
                    {formatPeso(order.total)}
                  </p>
                </div>
                {order.deliveryAddress ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted">
                    {order.deliveryAddress}
                  </p>
                ) : null}
                <p className="mt-1 truncate text-xs text-muted">
                  {itemSummary(order)}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <StatusBadge status={order.status} />
                  <span className="text-[11px] text-muted">
                    <span className="font-mono">{order.id}</span> ·{' '}
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ExportReportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        orders={orders}
        defaults={{ status, vendorId, branchId }}
      />
    </div>
  )
}
