import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, MessageCircle, MessageSquare, Search, ShoppingCart, X } from 'lucide-react'
import { BRAND_NAME, FEATURE_TAWAD_ENABLED } from '@/constants'
import { PortalSwitcher } from '@/components/shared/PortalSwitcher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getTotalUnread } from '@/lib/chat'
import { useCartStore } from '@/stores/cart-store'
import { useChatStore } from '@/stores/chat-store'
import { cn } from '@/lib/utils'

export function CustomerHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const items = useCartStore((s) => s.items)
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const chatThreads = useChatStore((s) => s.threads)
  const chatMessages = useChatStore((s) => s.messages)
  const chatUnread = getTotalUnread(chatThreads, chatMessages, 'customer')
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isHome =
    location.pathname === '/customer' || location.pathname === '/customer/'
  /** Transparent chrome over the hero until the solid layer has faded in. */
  const overlay = isHome && !scrolled

  useEffect(() => {
    if (!isHome) {
      setScrolled(false)
      return
    }

    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const onSearch = (event: FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/customer/products?q=${encodeURIComponent(q)}` : '/customer/products')
    setMobileOpen(false)
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'nav-ink nav-link',
      overlay ? 'nav-link-overlay' : 'nav-link-solid',
      isActive && 'is-active',
    )

  return (
    <header
      className={cn(
        'nav-shell z-40 border-b',
        isHome
          ? 'fixed inset-x-0 top-0 border-transparent'
          : 'sticky top-0 border-border bg-surface/95 shadow-sm backdrop-blur',
      )}
    >
      {isHome ? (
        <div
          className={cn('nav-solid-layer', scrolled && 'is-on')}
          aria-hidden
        />
      ) : null}

      <div className="relative mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'nav-ink lg:hidden',
            overlay && 'text-white hover:bg-white/15 hover:text-white',
          )}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <Link to="/customer" className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'nav-ink flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold text-white',
              overlay ? 'bg-white/20 ring-1 ring-white/40' : 'bg-primary ring-0',
            )}
          >
            PP
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                'nav-ink nav-brand-title truncate text-base sm:text-lg',
                overlay ? 'text-white' : 'text-primary-deep',
              )}
            >
              {BRAND_NAME}
            </p>
            <p
              className={cn(
                'nav-ink nav-brand-sub hidden text-[10px] sm:block',
                overlay ? 'text-white/65' : 'text-muted',
              )}
            >
              Local marketplace prototype
            </p>
          </div>
        </Link>

        <form onSubmit={onSearch} className="mx-auto hidden max-w-xl flex-1 md:flex">
          <div className="relative w-full">
            <Search
              className={cn(
                'nav-ink pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                overlay ? 'text-white/60' : 'text-muted',
              )}
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gulay, isda, karne..."
              className={cn(
                'nav-ink pl-9',
                overlay &&
                  'border-white/25 bg-white/10 text-white placeholder:text-white/55 focus-visible:ring-white/40',
              )}
              aria-label="Search products"
            />
          </div>
        </form>

        <nav className="ml-auto hidden items-center gap-7 lg:flex">
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
          <Button
            asChild
            variant="ghost"
            size="icon"
            className={cn(
              'nav-ink relative hidden sm:inline-flex',
              overlay && 'text-white hover:bg-white/15 hover:text-white',
            )}
          >
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
          <Button
            asChild
            variant="ghost"
            size="icon"
            className={cn(
              'nav-ink relative',
              overlay && 'text-white hover:bg-white/15 hover:text-white',
            )}
          >
            <Link to="/customer/cart" aria-label={`Cart with ${cartCount} items`}>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary-deep">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </Button>

          <PortalSwitcher
            className={cn(
              'nav-ink hidden sm:flex',
              overlay &&
                'border-white/30 bg-white/10 text-white [&_svg]:text-white',
            )}
          />
          <PortalSwitcher
            compact
            className={cn(
              'nav-ink sm:hidden',
              overlay &&
                'border-white/30 bg-white/10 text-white [&_svg]:text-white',
            )}
          />
        </div>
      </div>

      <div
        className={cn(
          'relative overflow-hidden border-t md:hidden',
          'transition-[max-height,opacity,border-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
          !overlay
            ? 'max-h-24 border-border opacity-100'
            : 'pointer-events-none max-h-0 border-transparent opacity-0',
        )}
      >
        <div className="bg-warm-white/80 px-4 py-2 sm:px-6">
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
      </div>

      {mobileOpen ? (
        <div
          className={cn(
            'nav-ink relative space-y-3 border-t px-4 py-4 lg:hidden',
            overlay
              ? 'border-white/15 bg-primary-deep/95 text-white backdrop-blur'
              : 'border-border bg-surface',
          )}
        >
          <nav className="flex flex-col gap-3">
            <NavLink
              to="/customer/products"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Products
            </NavLink>
            <NavLink
              to="/customer/orders"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              My Orders
            </NavLink>
            <NavLink
              to="/customer/chat"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <MessageCircle className="mr-1 inline h-4 w-4" />
              Chat
            </NavLink>
            {FEATURE_TAWAD_ENABLED ? (
              <NavLink
                to="/customer/offers"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                <MessageSquare className="mr-1 inline h-4 w-4" />
                My Offers
              </NavLink>
            ) : null}
            <NavLink
              to="/customer/cart"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Cart
            </NavLink>
            <NavLink
              to="/vendor"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              Vendor portal
            </NavLink>
            <NavLink
              to="/admin"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              LGU Admin
            </NavLink>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
