import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductImage } from '@/components/shared/ProductImage'
import { getStandardPrice } from '@/lib/pricing'
import { useCommodityStore } from '@/stores/commodity-store'
import { formatPeso } from '@/lib/utils'
import type { Product, Vendor } from '@/types'

interface ProductCardProps {
  product: Product
  vendor?: Vendor
  onAdd: (product: Product) => void
}

export function ProductCard({ product, vendor, onAdd }: ProductCardProps) {
  const commodities = useCommodityStore((s) => s.commodities)
  const standardPrice = getStandardPrice(product, commodities)
  const unavailable = !product.isAvailable || product.stock <= 0

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/customer/products/${product.id}`} className="block">
        <ProductImage
          src={product.imageUrl}
          alt={`${product.name} from ${vendor?.name ?? 'local vendor'}`}
          className="aspect-[4/3]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/customer/products/${product.id}`}
            className="line-clamp-2 font-semibold text-primary-deep hover:text-primary"
          >
            {product.name}
          </Link>
          <Badge variant={unavailable ? 'muted' : 'secondary'} className="shrink-0">
            {unavailable ? 'Unavailable' : 'In stock'}
          </Badge>
        </div>
        <div>
          <p className="text-base font-bold text-primary">
            {formatPeso(standardPrice)}
            <span className="ml-1 text-xs font-medium text-muted">/{product.unit}</span>
          </p>
          <p className="text-[10px] font-medium text-muted">LGU price</p>
        </div>
        {vendor ? (
          <Link
            to={`/customer/stores/${vendor.id}`}
            className="truncate text-xs text-muted hover:text-primary"
          >
            {vendor.name}
          </Link>
        ) : null}
        <Button
          className="mt-auto w-full"
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
