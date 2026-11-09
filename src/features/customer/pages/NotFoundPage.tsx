import { Link } from 'react-router-dom'
import { Home, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BRAND_NAME } from '@/constants'
import { LOGOS } from '@/lib/assets'

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      <span
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-lime/25 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-bay/20 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <img
          src={LOGOS.bagongParanaque}
          alt=""
          className="mx-auto h-36 w-36 object-contain drop-shadow-lg"
        />
        <p className="mt-4 font-display text-7xl font-extrabold leading-none text-primary">
          404
        </p>
        <h1 className="mt-4 text-2xl font-extrabold text-primary-deep sm:text-3xl">
          Page not found
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist in {BRAND_NAME}. It may
          have been moved or removed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/customer">
              <Home className="h-5 w-5" />
              Back to Home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/customer/vendors">
              <Store className="h-5 w-5" />
              Meet the vendors
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
