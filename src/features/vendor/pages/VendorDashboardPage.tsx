import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  ClipboardList,
  Clock,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { FEATURE_TAWAD_ENABLED, LOW_STOCK_THRESHOLD } from '@/constants'
import { getTotalUnread } from '@/lib/chat'
import { isVendorAcceptingOrders, formatVendorTime } from '@/lib/vendor-hours'
import { cn, formatDateTime, formatPeso } from '@/lib/utils'
import { useBranchStore } from '@/stores/branch-store'
import { useChatStore } from '@/stores/chat-store'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useOfferStore } from '@/stores/offer-store'
import { useOrderStore } from '@/stores/order-store'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import type { Order } from '@/types'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Magandang umaga'
  if (hour < 18) return 'Magandang hapon'
  return 'Magandang gabi'
}

export default function VendorDashboardPage() {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const vendor = useVendorStore((s) =>
    s.vendors.find((v) => v.id === activeVendorId),
  )
  const branches = useBranchStore((s) => s.branches)
  const getOrdersByVendor = useOrderStore((s) => s.getOrdersByVendor)
  const getOffersByVendor = useOfferStore((s) => s.getOffersByVendor)
  const products = useProductStore((s) => s.products)
  const chatThreads = useChatStore((s) => s.threads)
  const chatMessages = useChatStore((s) => s.messages)

  const vendorOrders = useMemo<Order[]>(
    () => getOrdersByVendor(activeVendorId),
    [getOrdersByVendor, activeVendorId],
  )
  const vendorOffers = useMemo(
    () => getOffersByVendor(activeVendorId),
    [getOffersByVendor, activeVendorId],
  )

  const stats = useMemo(() => {
    const confirmedOrders = vendorOrders.filter((o) => o.status === 'confirmed')
    return {
      total: vendorOrders.length,
      awaiting: vendorOrders.filter(
        (o) => o.status === 'awaiting_vendor_confirmation',
      ).length,
      confirmed: confirmedOrders.length,
      sales: confirmedOrders.reduce((sum, o) => sum + o.total, 0),
      rejected: vendorOrders.filter((o) => o.status === 'payment_rejected')
        .length,
      pendingOffers: vendorOffers.filter((o) => o.status === 'pending').length,
    }
  }, [vendorOrders, vendorOffers])

  const attentionProducts = useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.vendorId === activeVendorId &&
            !p.isArchived &&
            p.stock <= LOW_STOCK_THRESHOLD,
        )
        .sort((a, b) => a.stock - b.stock),
    [products, activeVendorId],
  )

  const unreadChats = getTotalUnread(
    chatThreads,
    chatMessages,
    'vendor',
    activeVendorId,
  )
  const branch = vendor
    ? branches.find((b) => b.id === vendor.branchId)
    : undefined
  const accepting = vendor ? isVendorAcceptingOrders(vendor) : false
  const recentOrders = vendorOrders.slice(0, 6)

  const attention = [
    stats.awaiting > 0 && {
      key: 'awaiting',
      to: '/vendor/orders',
      icon: Clock,
      tone: 'bg-gold-50 text-[#7a5d00]',
      title: `${stats.awaiting} order${stats.awaiting === 1 ? '' : 's'} waiting for your confirmation`,
      hint: 'Check the payment, then confirm or reject.',
    },
    unreadChats > 0 && {
      key: 'chat',
      to: '/vendor/chat',
      icon: MessageCircle,
      tone: 'bg-bay-50 text-[#1e6b64]',
      title: `${unreadChats} unread customer message${unreadChats === 1 ? '' : 's'}`,
      hint: 'Customers are waiting for a reply.',
    },
    stats.rejected > 0 && {
      key: 'rejected',
      to: '/vendor/orders',
      icon: XCircle,
      tone: 'bg-red-50 text-red-700',
      title: `${stats.rejected} rejected payment${stats.rejected === 1 ? '' : 's'}`,
      hint: 'Customers can resubmit their payment.',
    },
    FEATURE_TAWAD_ENABLED &&
      stats.pendingOffers > 0 && {
        key: 'offers',
        to: '/vendor/offers',
        icon: MessageSquare,
        tone: 'bg-lime-50 text-[#4d5a06]',
        title: `${stats.pendingOffers} pending offer${stats.pendingOffers === 1 ? '' : 's'}`,
        hint: 'Review price offers from customers.',
      },
  ].filter(Boolean) as {
    key: string
    to: string
    icon: typeof Clock
    tone: string
    title: string
    hint: string
  }[]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-deep via-primary-deep to-primary p-6 text-white shadow-[var(--shadow-lift)] sm:p-8">
        <span
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime/25 blur-3xl"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-bay/25 blur-3xl"
          aria-hidden
        />
        <span className="brand-ribbon absolute inset-x-0 bottom-0 h-1" aria-hidden />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-lime">
              <Sparkles className="h-3.5 w-3.5" />
              {greeting()}
            </p>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              {vendor?.name ?? 'Vendor'}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
                  accepting
                    ? 'bg-lime text-primary-deep'
                    : 'bg-white/15 text-white/85',
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    accepting ? 'bg-primary-deep' : 'bg-white/60',
                  )}
                />
                {accepting ? 'Accepting orders' : 'Not accepting orders'}
              </span>
              {vendor ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-white/90 ring-1 ring-white/15">
                  <Clock className="h-3.5 w-3.5" />
                  {formatVendorTime(vendor.opensAt)} – {formatVendorTime(vendor.cutoffTime)}
                </span>
              ) : null}
              {branch ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-white/90 ring-1 ring-white/15">
                  <MapPin className="h-3.5 w-3.5" />
                  {branch.name}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Button asChild variant="lime" size="lg">
              <Link to="/vendor/orders">
                <ClipboardList className="h-4 w-4" />
                View orders
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-white/25 bg-white/10 text-white shadow-none hover:bg-white/20"
            >
              <Link to="/vendor/products">
                <Package className="h-4 w-4" />
                Products
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total orders"
          value={stats.total}
          icon={ShoppingCart}
          tone="primary"
          to="/vendor/orders"
          hint={`${stats.confirmed} confirmed`}
        />
        <StatCard
          label="Awaiting confirmation"
          value={stats.awaiting}
          icon={Clock}
          tone="gold"
          to="/vendor/orders"
          hint={stats.awaiting > 0 ? 'Needs your action' : 'All caught up'}
        />
        <StatCard
          label="Confirmed sales"
          value={formatPeso(stats.sales)}
          icon={Banknote}
          tone="lime"
          hint="Excludes pending & rejected"
        />
        <StatCard
          label="Payment rejected"
          value={stats.rejected}
          icon={XCircle}
          tone="danger"
          to="/vendor/orders"
          hint="Customer may resubmit"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Recent orders */}
        <SectionCard
          title="Recent orders"
          icon={ClipboardList}
          bodyClassName="p-0 sm:p-0"
          action={
            vendorOrders.length > 0 ? (
              <Link
                to="/vendor/orders"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null
          }
        >
          {recentOrders.length === 0 ? (
            <div className="p-5 sm:p-6">
              <EmptyState
                icon={ClipboardList}
                title="No orders yet"
                description="Orders from customers will appear here once they check out."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/vendor/orders/${order.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-primary-50/60 sm:px-6"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-deep">
                      {initials(order.customerName) || '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-primary-deep">
                        {order.customerName}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {order.id} · {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                      <StatusBadge status={order.status} />
                      <span className="text-sm font-extrabold text-primary-deep">
                        {formatPeso(order.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Right column */}
        <div className="space-y-6">
          <SectionCard title="Needs attention" icon={TriangleAlert} bodyClassName="p-3 sm:p-3">
            {attention.length === 0 && attentionProducts.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted">
                Nothing urgent right now. Nice work!
              </p>
            ) : (
              <ul className="space-y-1">
                {attention.map((item) => (
                  <li key={item.key}>
                    <Link
                      to={item.to}
                      className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-primary-50/60"
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          item.tone,
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-primary-deep">
                          {item.title}
                        </span>
                        <span className="block text-xs text-muted">{item.hint}</span>
                      </span>
                    </Link>
                  </li>
                ))}
                {attentionProducts.length > 0 ? (
                  <li>
                    <Link
                      to="/vendor/products"
                      className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-primary-50/60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        <Package className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-primary-deep">
                          {attentionProducts.length} product
                          {attentionProducts.length === 1 ? '' : 's'} low or out of stock
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {attentionProducts
                            .slice(0, 3)
                            .map((p) => `${p.name} (${p.stock})`)
                            .join(', ')}
                        </span>
                      </span>
                    </Link>
                  </li>
                ) : null}
              </ul>
            )}
          </SectionCard>

          <div className="relative overflow-hidden rounded-2xl border border-lime/50 bg-gradient-to-br from-lime-50 to-white p-5">
            <p className="text-sm font-bold text-primary-deep">Keri delivery</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Once every vendor in a checkout confirms payment, a shared Keri
              tracking ID is created and you can mark pickup and delivery from
              the order page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
