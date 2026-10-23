import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import { CATEGORIES } from '@/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductCard } from '@/components/shared/ProductCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { VendorConflictDialog } from '@/components/shared/VendorConflictDialog'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useCommodityStore } from '@/stores/commodity-store'
import { useAddToCart } from '@/hooks/useAddToCart'
import { getStandardPrice } from '@/lib/pricing'

type SortOption = 'name-asc' | 'price-asc' | 'price-desc'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const products = useProductStore((s) => s.products)
  const vendors = useVendorStore((s) => s.vendors)
  const commodities = useCommodityStore((s) => s.commodities)
  const { addToCart, conflictOpen, currentVendorName, newVendorName, keepCurrentCart, replaceCart } =
    useAddToCart()

  const qParam = searchParams.get('q') ?? ''
  const categoryParam = searchParams.get('category') ?? ''
  const vendorParam = searchParams.get('vendor') ?? ''

  const [search, setSearch] = useState(qParam)
  const [category, setCategory] = useState(categoryParam)
  const [vendor, setVendor] = useState(vendorParam)
  const [availability, setAvailability] = useState<'all' | 'available'>('available')
  const [sort, setSort] = useState<SortOption>('name-asc')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const activeProducts = useMemo(() => {
    return products.filter((p) => !p.isArchived)
  }, [products])

  const filtered = useMemo(() => {
    let result = activeProducts

    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
    }

    if (category) {
      result = result.filter((p) => p.category === category)
    }

    if (vendor) {
      result = result.filter((p) => p.vendorId === vendor)
    }

    if (availability === 'available') {
      result = result.filter((p) => p.isAvailable && p.stock > 0)
    }

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return getStandardPrice(a, commodities) - getStandardPrice(b, commodities)
        case 'price-desc':
          return getStandardPrice(b, commodities) - getStandardPrice(a, commodities)
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return result
  }, [activeProducts, search, category, vendor, availability, sort, commodities])

  const applySearch = () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (category) params.set('category', category)
    if (vendor) params.set('vendor', vendor)
    setSearchParams(params, { replace: true })
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setVendor('')
    setAvailability('available')
    setSort('name-asc')
    setSearchParams({}, { replace: true })
  }

  const hasActiveFilters = search || category || vendor || availability !== 'available'

  const filterContent = (
    <div className="space-y-5">
      <div>
        <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
          Category
        </Label>
        <Select value={category} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
          Vendor
        </Label>
        <Select value={vendor} onValueChange={(v) => setVendor(v === 'all' ? '' : v)}>
          <SelectTrigger>
            <SelectValue placeholder="All vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vendors</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
          Availability
        </Label>
        <Select
          value={availability}
          onValueChange={(v) => setAvailability(v as 'all' | 'available')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available only</SelectItem>
            <SelectItem value="all">Show all</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
          Sort by
        </Label>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A–Z)</SelectItem>
            <SelectItem value="price-asc">Price (low → high)</SelectItem>
            <SelectItem value="price-desc">Price (high → low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
          <X className="h-4 w-4" />
          Clear all filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-primary-deep">Products</h1>
        <p className="mt-1 text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? 'item' : 'items'} found
        </p>
      </div>

      {/* Search bar */}
      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          applySearch()
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gulay, isda, karne..."
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileFiltersOpen((v) => !v)}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </form>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-36 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-primary-deep">
              <Filter className="h-4 w-4" />
              Filters
            </h2>
            {filterContent}
          </div>
        </aside>

        {/* Mobile filters */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-surface p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold text-primary-deep">
                  <Filter className="h-4 w-4" />
                  Filters
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {filterContent}
              <Button
                className="mt-5 w-full"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show results
              </Button>
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className="min-w-0 flex-1">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No products found"
              description="Try adjusting your search or filters to find what you're looking for."
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  vendor={vendors.find((v) => v.id === product.vendorId)}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <VendorConflictDialog
        open={conflictOpen}
        currentVendorName={currentVendorName}
        newVendorName={newVendorName}
        onKeep={keepCurrentCart}
        onReplace={replaceCart}
      />
    </div>
  )
}
