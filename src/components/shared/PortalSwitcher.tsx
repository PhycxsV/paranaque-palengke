import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Store } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type PortalValue = 'customer' | 'vendor' | 'admin'

const PORTALS: {
  value: PortalValue
  label: string
  path: string
  icon: typeof ShoppingBag
}[] = [
  { value: 'customer', label: 'Customer storefront', path: '/customer', icon: ShoppingBag },
  { value: 'vendor', label: 'Vendor portal', path: '/vendor', icon: Store },
  { value: 'admin', label: 'LGU Admin', path: '/admin', icon: LayoutDashboard },
]

function resolvePortal(pathname: string): PortalValue {
  if (pathname.startsWith('/vendor')) return 'vendor'
  if (pathname.startsWith('/admin')) return 'admin'
  return 'customer'
}

export function PortalSwitcher({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const current = resolvePortal(location.pathname)

  return (
    <Select
      value={current}
      onValueChange={(value) => {
        const portal = PORTALS.find((item) => item.value === value)
        if (portal) navigate(portal.path)
      }}
    >
      <SelectTrigger
        className={cn(
          'h-9 border-primary/20 bg-primary-50 text-sm font-medium text-primary-deep',
          compact ? 'w-[140px]' : 'w-[180px]',
          className,
        )}
        aria-label="Switch portal"
      >
        <SelectValue placeholder="Switch portal" />
      </SelectTrigger>
      <SelectContent>
        {PORTALS.map(({ value, label, icon: Icon }) => (
          <SelectItem key={value} value={value}>
            <span className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
