import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  BarChart3,
  ClipboardList,
  HandCoins,
  History,
  LayoutDashboard,
  Menu,
  ShoppingBag,
  Store,
  X,
  Wheat,
} from 'lucide-react'
import { BRAND_NAME, PRICE_DISCLAIMER } from '@/constants'
import { PortalSwitcher } from '@/components/shared/PortalSwitcher'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/commodities', label: 'Commodities', icon: Wheat },
  { to: '/admin/price-history', label: 'Price History', icon: History },
  { to: '/admin/vendors', label: 'Vendors', icon: Store },
  { to: '/admin/offers', label: 'Offers', icon: HandCoins },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
]

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full flex-col bg-primary-deep text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gold" />
          <p className="text-xs uppercase tracking-wider text-gold">
            LGU Admin
          </p>
        </div>
        <p className="mt-1 text-lg font-extrabold">{BRAND_NAME}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/75 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-3">
        <PortalSwitcher className="w-full border-white/20 bg-white/10 text-white [&_svg]:text-white" />
        <Link
          to="/customer"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <ShoppingBag className="h-4 w-4" />
          Back to storefront
        </Link>

        <p className="px-3 text-[10px] leading-tight text-white/40">
          {PRICE_DISCLAIMER}
        </p>
      </div>
    </aside>
  )
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-warm-white lg:grid lg:grid-cols-[260px_1fr]">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <AdminSidebar />
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-[280px] max-w-[85vw] overflow-y-auto">
            <AdminSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle admin menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <p className="font-bold text-primary-deep">LGU Admin</p>
        </div>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
