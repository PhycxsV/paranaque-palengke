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
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react'
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  CATEGORIES,
  CATEGORY_ICONS,
  HOME_TOP_RATED_VENDOR_COUNT,
} from '@/constants'
import { Button } from '@/components/ui/button'
import { RevealOnScroll } from '@/components/shared/RevealOnScroll'
import { VendorCard } from '@/components/shared/VendorCard'
import { useVendorStore } from '@/stores/vendor-store'
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
  const vendors = useVendorStore((s) => s.vendors)

  const topRatedVendors = [...vendors]
    .filter((v) => v.isAvailable)
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))
    .slice(0, HOME_TOP_RATED_VENDOR_COUNT)

  return (
    <>
      {/* Full-viewport landing — vendors only appear after scroll on any screen size */}
      <section className="relative flex min-h-[100dvh] items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1920&q=80"
            alt="Fresh vegetable market"
            className="h-full w-full scale-105 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#176B38]/90 via-[#176B38]/80 to-[#0f4a25]/90" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 sm:py-32">
          <div className="max-w-2xl">
            <p className="animate-hero-in mb-3 text-sm font-bold uppercase tracking-widest text-gold">
              {BRAND_NAME}
            </p>
            <h1 className="animate-hero-in animate-hero-in-delay-1 text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              {BRAND_TAGLINE}
            </h1>
            <p className="animate-hero-in animate-hero-in-delay-2 mt-4 max-w-lg text-base text-white/85 sm:text-lg">
              Fresh gulay, isda, and karne from Parañaque palengke vendors — order
              for Keri delivery.
            </p>
            <div className="animate-hero-in animate-hero-in-delay-3 mt-8 flex flex-wrap gap-3">
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

      {topRatedVendors.length > 0 && (
        <section className="bg-primary-50/40 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <RevealOnScroll>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold text-primary-deep">
                    Meet Our Vendors
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Top-rated stalls — pick a store first, then shop
                  </p>
                </div>
                <Button asChild variant="link" className="hidden sm:inline-flex">
                  <Link to="/customer/vendors">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </RevealOnScroll>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {topRatedVendors.map((v, index) => (
                <RevealOnScroll key={v.id} delayMs={index * 90}>
                  <VendorCard vendor={v} />
                </RevealOnScroll>
              ))}
            </div>
            <RevealOnScroll delayMs={200}>
              <div className="mt-6 text-center sm:hidden">
                <Button asChild variant="secondary">
                  <Link to="/customer/vendors">
                    View all vendors <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </RevealOnScroll>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <RevealOnScroll>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold text-primary-deep">
              Ano ang hanap mo?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Browse by category — fresh picks from local vendors
            </p>
          </div>
        </RevealOnScroll>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {CATEGORIES.map((cat, index) => {
            const Icon = getCategoryIcon(cat)
            return (
              <RevealOnScroll key={cat} delayMs={(index % 4) * 70}>
                <Link
                  to={`/customer/products?category=${encodeURIComponent(cat)}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5 text-center shadow-[var(--shadow-soft)] transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-primary-deep">{cat}</span>
                </Link>
              </RevealOnScroll>
            )
          })}
        </div>
      </section>
    </>
  )
}
