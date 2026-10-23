import { Link, NavLink } from 'react-router-dom'
import {
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingBag,
  Store,
} from 'lucide-react'
import { PortalSwitcher } from '@/components/shared/PortalSwitcher'
import { BRAND_NAME } from '@/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useVendorStore } from '@/stores/vendor-store'
import { cn } from '@/lib/utils'

const links = [
  { to: '/vendor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vendor/orders', label: 'Orders', icon: ClipboardList },
  { to: '/vendor/products', label: 'Products', icon: Package },
  { to: '/vendor/offers', label: 'Offers', icon: MessageSquare },
  { to: '/vendor/store', label: 'Store profile', icon: Store },
]

export function VendorSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const setActiveVendorId = useDemoSessionStore((s) => s.setActiveVendorId)
  const vendors = useVendorStore((s) => s.vendors)
  const vendor = vendors.find((v) => v.id === activeVendorId)

  return (
    <aside className="flex h-full flex-col bg-primary-deep text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs uppercase tracking-wider text-gold">Vendor portal</p>
        <p className="mt-1 text-lg font-extrabold">{BRAND_NAME}</p>
        <div className="mt-4">
          <p className="mb-1.5 text-xs text-white/60">Active store</p>
          <Select value={activeVendorId} onValueChange={setActiveVendorId}>
            <SelectTrigger className="border-white/20 bg-white/10 text-white">
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {vendor ? (
            <p className="mt-2 truncate text-xs text-white/55">{vendor.location}</p>
          ) : null}
        </div>
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
      <div className="space-y-2 border-t border-white/10 p-3">
        <PortalSwitcher className="w-full border-white/20 bg-white/10 text-white [&_svg]:text-white" />
        <Link
          to="/customer"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <ShoppingBag className="h-4 w-4" />
          Back to storefront
        </Link>
      </div>
    </aside>
  )
}
