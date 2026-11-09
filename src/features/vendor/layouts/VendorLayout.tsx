import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { ExternalLink, Menu, X } from 'lucide-react'
import { BrandMark } from '@/components/shared/BrandLogo'
import { Button } from '@/components/ui/button'
import { isVendorAcceptingOrders } from '@/lib/vendor-hours'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useVendorStore } from '@/stores/vendor-store'
import { cn } from '@/lib/utils'
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

export function VendorLayout() {
  const [open, setOpen] = useState(false)
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const vendorName = useVendorStore(
    (s) => s.vendors.find((v) => v.id === activeVendorId)?.name,
  )

  return (
    <div className="min-h-screen bg-warm-white lg:grid lg:grid-cols-[272px_1fr]">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <VendorSidebar />
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-primary-deep/50 backdrop-blur-sm"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-[290px] max-w-[85vw]">
            <VendorSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="min-w-0">
        {/* Mobile bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle vendor menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <BrandMark
            sealClassName="h-9 w-9"
            subtitle="Vendor portal"
            className="min-w-0 flex-1 [&_p:first-child]:text-base"
          />
          <StoreStatusPill className="hidden sm:inline-flex" />
        </div>

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
            <Button asChild variant="outline" size="sm">
              <Link to="/customer" target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                View storefront
              </Link>
            </Button>
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
