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
  ChevronDown,
  MapPin,
  ShoppingBag,
  ShoppingCart,
  Star,
  Truck,
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
import { SectionHeading } from '@/components/shared/SectionHeading'
import { VendorCard } from '@/components/shared/VendorCard'
import { LOGOS } from '@/lib/assets'
import { cn } from '@/lib/utils'
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

/** Rotating tints sampled from the logo palette. */
const CATEGORY_TINTS = [
  'bg-lime-50 text-primary ring-lime/40 group-hover:bg-lime',
  'bg-bay-50 text-[#1e6b64] ring-bay/30 group-hover:bg-bay',
  'bg-primary-50 text-primary ring-primary/15 group-hover:bg-primary',
  'bg-gold-50 text-[#7a5d00] ring-gold/40 group-hover:bg-gold',
]

const HERO_HIGHLIGHTS = [
  { icon: Star, label: 'Top-rated vendors' },
  { icon: MapPin, label: 'Pickup per palengke' },
  { icon: Truck, label: 'Keri delivery' },
]

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

  const [taglineLead, ...taglineRest] = BRAND_TAGLINE.split(', ')

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
          <div className="absolute inset-0 bg-gradient-to-br from-primary-deep/95 via-primary-deep/85 to-primary/70" />
          <div className="absolute -right-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-lime/20 blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 h-[26rem] w-[26rem] rounded-full bg-bay/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-40 pt-28 sm:px-6 sm:pt-32 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-2xl">
            <p className="animate-hero-in mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-lime backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden />
              {BRAND_NAME}
            </p>
            <h1 className="animate-hero-in animate-hero-in-delay-1 text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              {taglineLead},
              {taglineRest.length > 0 ? (
                <>
                  <br />
                  <span className="text-lime">{taglineRest.join(', ')}</span>
                </>
              ) : null}
            </h1>
            <p className="animate-hero-in animate-hero-in-delay-2 mt-5 max-w-lg text-base text-white/85 sm:text-lg">
              Fresh gulay, isda, and karne from Parañaque palengke vendors — order
              for Keri delivery.
            </p>
            <div className="animate-hero-in animate-hero-in-delay-3 mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="lime">
                <Link to="/customer/products">
                  <ShoppingBag className="h-5 w-5" />
                  Browse Palengke
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
              >
                <Link to="/customer/cart">
                  <ShoppingCart className="h-5 w-5" />
                  View Cart
                </Link>
              </Button>
            </div>
            <ul className="animate-hero-in animate-hero-in-delay-3 mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-white/85">
              {HERO_HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-lime ring-1 ring-white/20">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-hero-in animate-hero-in-delay-2 hidden justify-center lg:flex">
            <div className="relative">
              <div
                className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-lime/40 via-bay/30 to-transparent blur-2xl"
                aria-hidden
              />
              <div className="relative flex h-[22rem] w-[22rem] items-center justify-center rounded-full bg-white p-6 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.55)] ring-8 ring-white/20 xl:h-[26rem] xl:w-[26rem]">
                <img
                  src={LOGOS.bagongParanaque}
                  alt="Bagong Parañaque — Serbisyo Lang po"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="absolute -bottom-4 -left-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-[var(--shadow-lift)]">
                <img
                  src={LOGOS.citySeal}
                  alt="City of Parañaque seal"
                  className="h-9 w-9 object-contain"
                />
                <div className="leading-tight">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    City of
                  </p>
                  <p className="font-display text-sm font-extrabold text-primary-deep">
                    Parañaque
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a
          href="#vendors"
          className="absolute bottom-24 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:text-white sm:flex"
          aria-label="Scroll to vendors"
        >
          Scroll
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>

        <svg
          className="absolute inset-x-0 bottom-[-1px] h-16 w-full fill-warm-white sm:h-24"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0,64 C240,120 480,0 720,48 C960,96 1200,112 1440,40 L1440,120 L0,120 Z" />
        </svg>
      </section>

      {topRatedVendors.length > 0 && (
        <section id="vendors" className="scroll-mt-20 bg-warm-white pb-16 pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <RevealOnScroll>
              <SectionHeading
                className="mb-10"
                eyebrow="Top-rated stalls"
                title="Meet Our Vendors"
                description="Pick a store first, then shop — ranked by customer rating."
                action={
                  <Button asChild variant="outline" className="hidden sm:inline-flex">
                    <Link to="/customer/vendors">
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                }
              />
            </RevealOnScroll>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topRatedVendors.map((v, index) => (
                <RevealOnScroll key={v.id} delayMs={index * 90} className="h-full">
                  <VendorCard vendor={v} />
                </RevealOnScroll>
              ))}
            </div>
            <RevealOnScroll delayMs={200}>
              <div className="mt-8 text-center sm:hidden">
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

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <RevealOnScroll>
            <SectionHeading
              className="mb-10"
              align="center"
              eyebrow="Categories"
              title="Ano ang hanap mo?"
              description="Browse by category — fresh picks from local vendors."
            />
          </RevealOnScroll>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CATEGORIES.map((cat, index) => {
              const Icon = getCategoryIcon(cat)
              return (
                <RevealOnScroll key={cat} delayMs={(index % 4) * 70}>
                  <Link
                    to={`/customer/products?category=${encodeURIComponent(cat)}`}
                    className="group hover-lift flex flex-col items-center gap-4 rounded-2xl border border-border bg-warm-white p-6 text-center"
                  >
                    <div
                      className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-2xl ring-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:text-primary-deep',
                        CATEGORY_TINTS[index % CATEGORY_TINTS.length],
                      )}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className="font-display text-base font-bold text-primary-deep">
                      {cat}
                    </span>
                  </Link>
                </RevealOnScroll>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
