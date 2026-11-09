import { NavLink } from 'react-router-dom'
import { Home, MessageCircle, Package, ShoppingBag, ShoppingCart } from 'lucide-react'
import { getTotalUnread } from '@/lib/chat'
import { useCartStore } from '@/stores/cart-store'
import { useChatStore } from '@/stores/chat-store'
import { cn } from '@/lib/utils'

const items = [
  { to: '/customer', label: 'Home', icon: Home },
  { to: '/customer/products', label: 'Shop', icon: ShoppingBag },
  { to: '/customer/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/customer/chat', label: 'Chat', icon: MessageCircle },
  { to: '/customer/orders', label: 'Orders', icon: Package },
]

export function CustomerBottomNav() {
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0),
  )
  const threads = useChatStore((s) => s.threads)
  const messages = useChatStore((s) => s.messages)
  const chatUnread = getTotalUnread(threads, messages, 'customer')

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border bg-surface/90 p-1.5 shadow-[var(--shadow-lift)] backdrop-blur-xl md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/customer'}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-all duration-300',
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-muted hover:bg-primary-50',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
              {to === '/customer/cart' && cartCount > 0 ? (
                <span className="absolute right-3 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-primary-deep ring-2 ring-surface">
                  {cartCount}
                </span>
              ) : null}
              {to === '/customer/chat' && chatUnread > 0 ? (
                <span className="absolute right-3 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 text-[9px] font-bold text-primary-deep ring-2 ring-surface">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              ) : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
