import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ClipboardList,
  ExternalLink,
  HandCoins,
  LayoutDashboard,
  MessageCircle,
  MessageSquareHeart,
  MoreHorizontal,
  Package,
  Store,
  type LucideIcon,
} from 'lucide-react'
import { PortalSwitcher } from '@/components/shared/PortalSwitcher'
import { TextSizeControl } from '@/components/shared/TextSizeControl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FEATURE_TAWAD_ENABLED } from '@/constants'
import { getTotalUnread } from '@/lib/chat'
import { formatVendorTime, isVendorAcceptingOrders } from '@/lib/vendor-hours'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat-store'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useOrderStore } from '@/stores/order-store'
import { useVendorStore } from '@/stores/vendor-store'
import { VendorSidebar } from './VendorSidebar'

function StoreStatusPill({ className }: { className?: string }) {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const vendor = useVendorStore((s) =>
    s.vendors.find((v) => v.id === activeVendorId),
  )
  if (!vendor) return null
  const open = isVendorAcceptingOrders(vendor)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold',
        open
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-border bg-gray-100 text-muted',
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        {open ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
        ) : null}
        <span
          className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            open ? 'bg-emerald-500' : 'bg-gray-400',
          )}
        />
      </span>
      {open ? 'Accepting orders' : 'Not accepting orders'}
    </span>
  )
}

/** Live counts for the tab bar badges. */
function useVendorBadges() {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const orders = useOrderStore((s) => s.orders)
  const threads = useChatStore((s) => s.threads)
  const messages = useChatStore((s) => s.messages)

  return useMemo(
    () => ({
      awaiting: orders.filter(
        (o) =>
          o.vendorId === activeVendorId &&
          o.status === 'awaiting_vendor_confirmation',
      ).length,
      unread: getTotalUnread(threads, messages, 'vendor', activeVendorId),
    }),
    [orders, threads, messages, activeVendorId],
  )
}

/** App-style header shown on phones. */
function MobileTopBar() {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const vendor = useVendorStore((s) =>
    s.vendors.find((v) => v.id === activeVendorId),
  )
  const open = vendor ? isVendorAcceptingOrders(vendor) : false

  return (
    <header className="sticky top-0 z-30 lg:hidden">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-deep via-primary-deep to-primary px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <span
          className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-lime/25 blur-3xl"
          aria-hidden
        />
        <span className="brand-ribbon absolute inset-x-0 bottom-0 h-0.5" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime font-display text-lg font-extrabold text-primary-deep shadow-sm">
            {vendor?.name.charAt(0).toUpperCase() ?? 'V'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold leading-tight">
              {vendor?.name ?? 'Vendor'}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-white/80">
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  open ? 'bg-lime shadow-[0_0_0_3px_rgb(191_210_47/0.3)]' : 'bg-white/50',
                )}
              />
              <span className="truncate">
                {open
                  ? `Open · until ${vendor ? formatVendorTime(vendor.cutoffTime) : ''}`
                  : 'Not accepting orders'}
              </span>
            </p>
          </div>
          <TextSizeControl onDark className="shrink-0" />
        </div>
      </div>
    </header>
  )
}

interface TabDef {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: number
}

function TabBar({ onMore, moreActive }: { onMore: () => void; moreActive: boolean }) {
  const { awaiting, unread } = useVendorBadges()
  const tabs: TabDef[] = [
    { to: '/vendor', label: 'Home', icon: LayoutDashboard, end: true },
    { to: '/vendor/orders', label: 'Orders', icon: ClipboardList, badge: awaiting },
    { to: '/vendor/products', label: 'Products', icon: Package },
    { to: '/vendor/chat', label: 'Chat', icon: MessageCircle, badge: unread },
  ]

  const itemClass = 'group flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-bold'
  const pill = (active: boolean) =>
    cn(
      'relative flex h-8 w-14 items-center justify-center rounded-full transition-all duration-300',
      active
        ? 'bg-primary text-white shadow-md shadow-primary/30'
        : 'text-muted group-active:scale-90',
    )

  return (
    <nav
      aria-label="Vendor navigation"
      className="app-tabbar fixed inset-x-3 bottom-3 z-40 lg:hidden"
    >
      <div className="flex items-stretch rounded-[1.75rem] border border-border bg-surface/95 px-1.5 py-1 shadow-[0_12px_36px_-8px_rgb(21_63_42/0.35)] backdrop-blur-xl">
        {tabs.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end} className={itemClass}>
            {({ isActive }) => (
              <>
                <span className={pill(isActive)}>
                  <Icon className="h-5 w-5" />
                  {badge ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-extrabold text-primary-deep ring-2 ring-surface">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  ) : null}
                </span>
                <span className={isActive ? 'text-primary-deep' : 'text-muted'}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onMore}
          aria-haspopup="dialog"
          className={itemClass}
        >
          <span className={pill(moreActive)}>
            <MoreHorizontal className="h-5 w-5" />
          </span>
          <span className={moreActive ? 'text-primary-deep' : 'text-muted'}>More</span>
        </button>
      </div>
    </nav>
  )
}

function MoreSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const setActiveVendorId = useDemoSessionStore((s) => s.setActiveVendorId)
  const vendors = useVendorStore((s) => s.vendors)
  const close = () => onOpenChange(false)

  const links: { to: string; label: string; hint: string; icon: LucideIcon }[] = [
    { to: '/vendor/feedback', label: 'Feedback', hint: 'Customer reviews', icon: MessageSquareHeart },
    { to: '/vendor/store', label: 'Store profile', hint: 'Hours & details', icon: Store },
    ...(FEATURE_TAWAD_ENABLED
      ? [{ to: '/vendor/offers', label: 'Offers', hint: 'Price offers', icon: HandCoins }]
      : []),
    { to: '/customer', label: 'Storefront', hint: 'See what shoppers see', icon: ExternalLink },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileSheet className="max-w-md">
        <DialogHeader className="pt-8">
          <DialogTitle>More</DialogTitle>
          <DialogDescription>Store tools and settings.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-6">
            <section className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Active store (demo)
              </p>
              <Select value={activeVendorId} onValueChange={setActiveVendorId}>
                <SelectTrigger aria-label="Active store">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <ul className="grid grid-cols-2 gap-3">
              {links.map(({ to, label, hint, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={close}
                    className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-warm-white/70 p-4 transition active:scale-[0.97] hover:border-primary/40 hover:bg-primary-50"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-primary-deep">
                        {label}
                      </span>
                      <span className="block text-xs text-muted">{hint}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <section className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Text size
              </p>
              <TextSizeControl variant="inline" />
            </section>

            <section className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Switch portal
              </p>
              <PortalSwitcher className="h-11 w-full" />
            </section>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export function VendorLayout() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const vendorName = useVendorStore(
    (s) => s.vendors.find((v) => v.id === activeVendorId)?.name,
  )

  const moreActive = ['/vendor/feedback', '/vendor/store', '/vendor/offers'].some(
    (path) => location.pathname.startsWith(path),
  )

  return (
    <div className="min-h-screen bg-warm-white lg:grid lg:grid-cols-[272px_1fr]">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <VendorSidebar />
        </div>
      </div>

      <div className="min-w-0">
        <MobileTopBar />

        {/* Desktop bar */}
        <div className="sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-border bg-surface/85 px-8 py-3 backdrop-blur lg:flex">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-primary-deep">
              {vendorName ?? 'Vendor'}
            </p>
            <p className="text-xs text-muted">Vendor workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <StoreStatusPill />
            <TextSizeControl />
            <Button asChild variant="outline" size="sm">
              <Link to="/customer" target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                View storefront
              </Link>
            </Button>
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8">
          <Outlet />
        </main>
      </div>

      <TabBar onMore={() => setMoreOpen(true)} moreActive={moreActive} />
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </div>
  )
}
