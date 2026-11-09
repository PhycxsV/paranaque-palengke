import { Link } from 'react-router-dom'
import { Plus, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductImage } from '@/components/shared/ProductImage'
import { LOW_STOCK_THRESHOLD } from '@/constants'
import { getCommodityRange, getVendorPrice } from '@/lib/pricing'
import { isVendorAcceptingOrders } from '@/lib/vendor-hours'
import { useCommodityStore } from '@/stores/commodity-store'
import { cn, formatPeso } from '@/lib/utils'
import type { Product, Vendor } from '@/types'

interface ProductCardProps {
  product: Product
  vendor?: Vendor
  onAdd: (product: Product) => void
}

interface CardBadge {
  label: string
  tone: 'muted' | 'warn'
}

export function ProductCard({ product, vendor, onAdd }: ProductCardProps) {
  const commodities = useCommodityStore((s) => s.commodities)
  const vendorPrice = getVendorPrice(product, commodities)
  const range = getCommodityRange(product, commodities)
  const vendorClosed = vendor ? !isVendorAcceptingOrders(vendor) : false
  const unavailable =
    !product.isAvailable || product.stock <= 0 || vendorClosed

  // Only call out exceptions — a normal in-stock product needs no badge.
  let badge: CardBadge | null = null
  if (vendorClosed) badge = { label: 'Past cut-off', tone: 'muted' }
  else if (product.stock <= 0) badge = { label: 'Out of stock', tone: 'muted' }
  else if (!product.isAvailable) badge = { label: 'Unavailable', tone: 'muted' }
  else if (product.stock <= LOW_STOCK_THRESHOLD)
    badge = { label: `Only ${product.stock} left`, tone: 'warn' }

  return (
    <article
      className={cn(
        'group hover-lift flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]',
        unavailable && 'opacity-80',
      )}
    >
      <Link
        to={`/customer/products/${product.id}`}
        className="relative block overflow-hidden"
      >
        <ProductImage
          src={product.imageUrl}
          alt={`${product.name} from ${vendor?.name ?? 'local vendor'}`}
          className={cn('aspect-[4/3]', unavailable && 'grayscale-[0.4]')}
          imgClassName="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />
        {badge ? (
          <span
            className={cn(
              'absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur',
              badge.tone === 'warn'
                ? 'bg-gold text-primary-deep'
                : 'bg-white/95 text-muted',
            )}
          >
            {badge.label}
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <Link
          to={`/customer/products/${product.id}`}
          className="line-clamp-2 font-display text-base font-bold leading-snug text-primary-deep transition-colors hover:text-primary"
        >
          {product.name}
        </Link>
        {vendor ? (
          <Link
            to={`/customer/stores/${vendor.id}`}
            className="inline-flex items-center gap-1.5 truncate text-xs font-medium text-muted transition-colors hover:text-primary"
          >
            <Store className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{vendor.name}</span>
          </Link>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <p className="font-display text-xl font-extrabold leading-none text-primary">
            {formatPeso(vendorPrice)}
            <span className="ml-1 font-sans text-xs font-semibold text-muted">
              /{product.unit === 'piece' ? 'pcs' : product.unit}
            </span>
          </p>
          {range ? (
            <p className="rounded-full bg-bay-50 px-2 py-0.5 text-[10px] font-semibold text-[#1e6b64]">
              LGU {formatPeso(range.min)}–{formatPeso(range.max)}
            </p>
          ) : null}
        </div>
        <Button
          className="w-full"
          size="sm"
          disabled={unavailable}
          onClick={() => onAdd(product)}
        >
          <Plus className="h-4 w-4" />
          Add to cart
        </Button>
      </div>
    </article>
  )
}
