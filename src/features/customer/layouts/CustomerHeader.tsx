import { useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, MessageCircle, MessageSquare, Search, ShoppingCart, X } from 'lucide-react'
import { BRAND_NAME, FEATURE_TAWAD_ENABLED } from '@/constants'
import { PortalSwitcher } from '@/components/shared/PortalSwitcher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getTotalUnread } from '@/lib/chat'
import { useCartStore } from '@/stores/cart-store'
import { useChatStore } from '@/stores/chat-store'
import { cn } from '@/lib/utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-sm font-medium transition-colors hover:text-primary',
    isActive ? 'text-primary' : 'text-ink/80',
  )

export function CustomerHeader() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const chatThreads = useChatStore((s) => s.threads)
  const chatMessages = useChatStore((s) => s.messages)
  const chatUnread = getTotalUnread(chatThreads, chatMessages, 'customer')
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const onSearch = (event: FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/customer/products?q=${encodeURIComponent(q)}` : '/customer/products')
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <Link to="/customer" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-white">
            PP
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-primary-deep sm:text-lg">
              {BRAND_NAME}
            </p>
            <p className="hidden text-[11px] text-muted sm:block">
              Local marketplace prototype
            </p>
          </div>
        </Link>

        <form onSubmit={onSearch} className="mx-auto hidden max-w-xl flex-1 md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gulay, isda, karne..."
              className="pl-9"
              aria-label="Search products"
            />
          </div>
        </form>

        <nav className="ml-auto hidden items-center gap-5 lg:flex">
          <NavLink to="/customer/products" className={navLinkClass}>
            Products
          </NavLink>
          <NavLink to="/customer/orders" className={navLinkClass}>
            My Orders
          </NavLink>
          <NavLink to="/customer/chat" className={navLinkClass}>
            Chat
          </NavLink>
          {FEATURE_TAWAD_ENABLED ? (
            <NavLink to="/customer/offers" className={navLinkClass}>
              My Offers
            </NavLink>
          ) : null}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="icon" className="relative hidden sm:inline-flex">
            <Link
              to="/customer/chat"
              aria-label={
                chatUnread > 0
                  ? `Chat with vendors, ${chatUnread} unread`
                  : 'Chat with vendors'
              }
            >
              <MessageCircle className="h-5 w-5" />
              {chatUnread > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              ) : null}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/customer/cart" aria-label={`Cart with ${cartCount} items`}>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary-deep">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </Button>

          <PortalSwitcher className="hidden sm:flex" />
          <PortalSwitcher compact className="sm:hidden" />
        </div>
      </div>

      <div className="border-t border-border bg-warm-white/80 px-4 py-2 md:hidden sm:px-6">
        <form onSubmit={onSearch}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
        </form>
      </div>

      {mobileOpen ? (
        <div className="space-y-3 border-t border-border bg-surface px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            <NavLink to="/customer/products" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Products
            </NavLink>
            <NavLink to="/customer/orders" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              My Orders
            </NavLink>
            <NavLink to="/customer/chat" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              <MessageCircle className="mr-1 inline h-4 w-4" />
              Chat
            </NavLink>
            {FEATURE_TAWAD_ENABLED ? (
              <NavLink to="/customer/offers" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                <MessageSquare className="mr-1 inline h-4 w-4" />
                My Offers
              </NavLink>
            ) : null}
            <NavLink to="/customer/cart" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Cart
            </NavLink>
            <NavLink to="/vendor" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Vendor portal
            </NavLink>
            <NavLink to="/admin" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              LGU Admin
            </NavLink>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
