import { Link, NavLink } from 'react-router-dom'
import {
  ClipboardList,
  HandCoins,
  LayoutDashboard,
  MessageCircle,
  Package,
  ShoppingBag,
  Store,
} from 'lucide-react'
import {
  SidebarBackdrop,
  SidebarBrand,
} from '@/components/shared/PortalSidebarParts'
import { SIDEBAR_SURFACE, sidebarLinkClass } from '@/components/shared/sidebar-styles'
import { PortalSwitcher } from '@/components/shared/PortalSwitcher'
import { FEATURE_TAWAD_ENABLED } from '@/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getTotalUnread } from '@/lib/chat'
import { useChatStore } from '@/stores/chat-store'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useVendorStore } from '@/stores/vendor-store'

const links = [
  { to: '/vendor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vendor/orders', label: 'Orders', icon: ClipboardList },
  { to: '/vendor/products', label: 'Products', icon: Package },
  { to: '/vendor/chat', label: 'Chat', icon: MessageCircle },
  { to: '/vendor/offers', label: 'Offers', icon: HandCoins },
  { to: '/vendor/store', label: 'Store profile', icon: Store },
].filter((link) => FEATURE_TAWAD_ENABLED || link.to !== '/vendor/offers')

export function VendorSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const setActiveVendorId = useDemoSessionStore((s) => s.setActiveVendorId)
  const vendors = useVendorStore((s) => s.vendors)
  const vendor = vendors.find((v) => v.id === activeVendorId)
  const chatThreads = useChatStore((s) => s.threads)
  const chatMessages = useChatStore((s) => s.messages)
  const chatUnread = getTotalUnread(
    chatThreads,
    chatMessages,
    'vendor',
    activeVendorId,
  )

  return (
    <aside className={SIDEBAR_SURFACE}>
      <SidebarBackdrop />
      <SidebarBrand portalLabel="Vendor portal">
        <div className="mt-5 rounded-xl bg-white/8 p-3 ring-1 ring-white/10">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
            Active store
          </p>
          <Select value={activeVendorId} onValueChange={setActiveVendorId}>
            <SelectTrigger className="h-10 border-white/20 bg-white/10 text-white">
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
            <p className="mt-2 truncate text-xs text-white/60">{vendor.location}</p>
          ) : null}
        </div>
      </SidebarBrand>
      <nav className="relative flex-1 space-y-1 px-3 py-4">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => sidebarLinkClass(isActive)}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {to === '/vendor/chat' && chatUnread > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary-deep">
                {chatUnread > 9 ? '9+' : chatUnread}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>
      <div className="relative space-y-2 border-t border-white/10 p-3">
        <PortalSwitcher className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15 [&_svg]:text-white" />
        <Link
          to="/customer"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <ShoppingBag className="h-4 w-4" />
          Back to storefront
        </Link>
      </div>
    </aside>
  )
}
