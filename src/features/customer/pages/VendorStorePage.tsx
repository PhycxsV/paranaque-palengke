import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, MessageCircle, Search, Star, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCard } from '@/components/shared/ProductCard'
import { ProductImage } from '@/components/shared/ProductImage'
import { EmptyState } from '@/components/shared/EmptyState'
import { Notice } from '@/components/shared/Notice'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useBranchStore } from '@/stores/branch-store'
import { useAddToCart } from '@/hooks/useAddToCart'
import {
  formatVendorTime,
  isVendorAcceptingOrders,
} from '@/lib/vendor-hours'
import { cn } from '@/lib/utils'

export default function VendorStorePage() {
  const navigate = useNavigate()
  const { vendorId } = useParams<{ vendorId: string }>()
  const vendors = useVendorStore((s) => s.vendors)
  const products = useProductStore((s) => s.products)
  const branches = useBranchStore((s) => s.branches)
  const { addToCart } = useAddToCart()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const vendor = vendors.find((v) => v.id === vendorId)
  const branch = vendor ? branches.find((b) => b.id === vendor.branchId) : undefined
  const acceptingOrders = vendor ? isVendorAcceptingOrders(vendor) : false

  const vendorProducts = useMemo(() => {
    if (!vendor) return []
    let result = products.filter((p) => p.vendorId === vendor.id && !p.isArchived)

    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      )
    }

    if (category) {
      result = result.filter((p) => p.category === category)
    }

    return result
  }, [vendor, products, search, category])

  if (!vendor) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={Store}
          title="Vendor not found"
          description="This vendor may have been removed or doesn't exist."
          actionLabel="Browse products"
          onAction={() => navigate('/customer/products')}
        />
      </div>
    )
  }

  const chipClass = (active: boolean) =>
    cn(
      'shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200',
      active
        ? 'border-primary bg-primary text-white shadow-sm shadow-primary/25'
        : 'border-border bg-surface text-primary-deep hover:border-primary/40 hover:bg-primary-50',
    )

  return (
    <div>
      {/* Vendor banner */}
      <div className="relative">
        <ProductImage
          src={vendor.imageUrl}
          alt={vendor.name}
          className="h-64 w-full sm:h-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/55 to-primary-deep/10" />
        <span className="brand-ribbon absolute inset-x-0 bottom-0 h-1" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-7 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Link
              to="/customer/vendors"
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/75 transition hover:text-lime"
            >
              <ArrowLeft className="h-4 w-4" />
              All vendors
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
                {vendor.name}
              </h1>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                  acceptingOrders
                    ? 'bg-lime text-primary-deep'
                    : 'bg-white/90 text-muted',
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    acceptingOrders ? 'bg-primary' : 'bg-muted',
                  )}
                />
                {acceptingOrders ? 'Open' : 'Closed'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                {Number.isFinite(vendor.rating) ? vendor.rating.toFixed(1) : '—'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                <MapPin className="h-3.5 w-3.5 text-lime" />
                {branch ? `${branch.name} · ` : ''}
                {vendor.location}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                <Clock className="h-3.5 w-3.5 text-lime" />
                {formatVendorTime(vendor.opensAt)} – cut-off{' '}
                {formatVendorTime(vendor.cutoffTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {!acceptingOrders && (
          <Notice tone="warning" className="mb-6" title="Past today's order cut-off">
            This vendor closed orders at {formatVendorTime(vendor.cutoffTime)}. You can
            browse products, but new orders are disabled.
          </Notice>
        )}

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <p className="max-w-2xl text-sm leading-relaxed text-ink/75 sm:text-base">
            {vendor.description}
          </p>
          <Button asChild variant="outline">
            <Link to={`/customer/chat?vendor=${vendor.id}`}>
              <MessageCircle className="h-4 w-4" />
              Message vendor
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search in ${vendor.name}...`}
              className="pl-10"
            />
          </div>
          {vendor.categories.length > 0 ? (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              <button
                type="button"
                className={chipClass(!category)}
                onClick={() => setCategory('')}
              >
                All
              </button>
              {vendor.categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={chipClass(category === cat)}
                  onClick={() => setCategory(category === cat ? '' : cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Products */}
        {vendorProducts.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No products found"
            description={
              search || category
                ? 'Try adjusting your search or filter.'
                : 'This vendor has no products listed yet.'
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {vendorProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                vendor={vendor}
                onAdd={addToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
