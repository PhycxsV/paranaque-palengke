import { NavLink } from 'react-router-dom'
import { Home, MessageSquare, Package, ShoppingBag, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { cn } from '@/lib/utils'

const items = [
  { to: '/customer', label: 'Home', icon: Home },
  { to: '/customer/products', label: 'Shop', icon: ShoppingBag },
  { to: '/customer/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/customer/offers', label: 'Offers', icon: MessageSquare },
  { to: '/customer/orders', label: 'Orders', icon: Package },
]

export function CustomerBottomNav() {
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0),
  )

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/customer'}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium',
                  isActive ? 'text-primary' : 'text-muted',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
              {to === '/customer/cart' && cartCount > 0 ? (
                <span className="absolute right-4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-primary-deep">
                  {cartCount}
                </span>
              ) : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
