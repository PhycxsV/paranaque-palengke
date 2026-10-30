import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clock, MapPin, MessageCircle, Search, Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductCard } from '@/components/shared/ProductCard'
import { ProductImage } from '@/components/shared/ProductImage'
import { EmptyState } from '@/components/shared/EmptyState'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useAddToCart } from '@/hooks/useAddToCart'
import {
  formatVendorTime,
  isVendorAcceptingOrders,
} from '@/lib/vendor-hours'

export default function VendorStorePage() {
  const { vendorId } = useParams<{ vendorId: string }>()
  const vendors = useVendorStore((s) => s.vendors)
  const products = useProductStore((s) => s.products)
  const { addToCart } = useAddToCart()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const vendor = vendors.find((v) => v.id === vendorId)
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
          onAction={() => {
            window.location.href = '/customer/products'
          }}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Vendor Banner */}
      <div className="relative">
        <ProductImage
          src={vendor.imageUrl}
          alt={vendor.name}
          className="h-48 w-full sm:h-64"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                {vendor.name}
              </h1>
              <Badge variant={acceptingOrders ? 'success' : 'muted'}>
                {acceptingOrders ? 'Open' : 'Closed'}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
              <MapPin className="h-3.5 w-3.5" />
              {vendor.location}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
              <Clock className="h-3.5 w-3.5" />
              {formatVendorTime(vendor.opensAt)} – cut-off{' '}
              {formatVendorTime(vendor.cutoffTime)}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {!acceptingOrders && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This vendor is past today&apos;s order cut-off (
            {formatVendorTime(vendor.cutoffTime)}). You can browse products, but
            new orders are disabled.
          </div>
        )}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-2xl text-sm text-ink/75">{vendor.description}</p>
          <Button asChild variant="secondary" size="sm">
            <Link to={`/customer/chat?vendor=${vendor.id}`}>
              <MessageCircle className="h-4 w-4" />
              Message vendor
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search in ${vendor.name}...`}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {vendor.categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
