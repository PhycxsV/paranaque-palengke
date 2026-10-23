import type { ElementType } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Leaf,
  Apple,
  Fish,
  Beef,
  Egg,
  Wheat,
  Flame,
  MapPin,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react'
import { BRAND_NAME, BRAND_TAGLINE, CATEGORIES, CATEGORY_ICONS } from '@/constants'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/shared/ProductCard'
import { VendorConflictDialog } from '@/components/shared/VendorConflictDialog'
import { ProductImage } from '@/components/shared/ProductImage'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useAddToCart } from '@/hooks/useAddToCart'
import type { ProductCategory } from '@/types'

const lucideIcons: Record<string, ElementType> = {
  Leaf,
  Apple,
  Fish,
  Beef,
  Drumstick: Beef,
  Wheat,
  Egg,
  Flame,
}

function getCategoryIcon(category: ProductCategory) {
  const iconName = CATEGORY_ICONS[category]
  return lucideIcons[iconName] ?? Leaf
}

export default function HomePage() {
  const products = useProductStore((s) => s.products)
  const vendors = useVendorStore((s) => s.vendors)
  const { addToCart, conflictOpen, currentVendorName, newVendorName, keepCurrentCart, replaceCart } =
    useAddToCart()

  const activeProducts = products.filter((p) => !p.isArchived && p.isAvailable)
  const featuredProducts = activeProducts.filter((p) => p.isFeatured).slice(0, 4)
  const popularProducts = activeProducts.filter((p) => p.isPopular).slice(0, 6)
  const activeVendors = vendors.filter((v) => v.isAvailable).slice(0, 4)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1920&q=80"
            alt="Fresh vegetable market"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#176B38]/90 via-[#176B38]/80 to-[#0f4a25]/90" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-gold">
              {BRAND_NAME}
            </p>
            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              {BRAND_TAGLINE}
            </h1>
            <p className="mt-4 max-w-lg text-base text-white/85 sm:text-lg">
              Discover fresh gulay, isda, karne, and more from your favorite Parañaque
              palengke vendors — all in one place. A demo marketplace prototype.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="gold">
                <Link to="/customer/products">
                  <ShoppingBag className="h-5 w-5" />
                  Browse Palengke
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
              >
                <Link to="/customer/cart">
                  <ShoppingCart className="h-5 w-5" />
                  View Cart
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-extrabold text-primary-deep">
            Ano ang hanap mo?
          </h2>
          <p className="mt-2 text-sm text-muted">
            Browse by category — fresh picks from local vendors
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const Icon = getCategoryIcon(cat)
            return (
              <Link
                key={cat}
                to={`/customer/products?category=${encodeURIComponent(cat)}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5 text-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-primary-deep">{cat}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-primary-deep">
                Featured Products
              </h2>
              <p className="mt-1 text-sm text-muted">
                Hand-picked fresh goods from local stalls
              </p>
            </div>
            <Button asChild variant="link" className="hidden sm:inline-flex">
              <Link to="/customer/products">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                vendor={vendors.find((v) => v.id === product.vendorId)}
                onAdd={addToCart}
              />
            ))}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <Button asChild variant="secondary">
              <Link to="/customer/products">
                View all products <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Featured Vendors */}
      {activeVendors.length > 0 && (
        <section className="bg-primary-50/40 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-extrabold text-primary-deep">
                Meet Our Vendors
              </h2>
              <p className="mt-2 text-sm text-muted">
                Local palengke stalls ready to serve you
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {activeVendors.map((v) => (
                <Link
                  key={v.id}
                  to={`/customer/stores/${v.id}`}
                  className="group overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <ProductImage
                    src={v.imageUrl}
                    alt={v.name}
                    className="aspect-[16/10]"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-primary-deep group-hover:text-primary">
                      {v.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <MapPin className="h-3 w-3" />
                      {v.location}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-ink/70">
                      {v.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Products */}
      {popularProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-primary-deep">
                Patok na Produkto
              </h2>
              <p className="mt-1 text-sm text-muted">
                Customer favorites from the palengke
              </p>
            </div>
            <Button asChild variant="link" className="hidden sm:inline-flex">
              <Link to="/customer/products">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                vendor={vendors.find((v) => v.id === product.vendorId)}
                onAdd={addToCart}
              />
            ))}
          </div>
        </section>
      )}

      <VendorConflictDialog
        open={conflictOpen}
        currentVendorName={currentVendorName}
        newVendorName={newVendorName}
        onKeep={keepCurrentCart}
        onReplace={replaceCart}
      />
    </>
  )
}
