import { Link } from 'react-router-dom'
import { BRAND_NAME, FEATURE_TAWAD_ENABLED } from '@/constants'

export function CustomerFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-primary-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold">{BRAND_NAME}</p>
          <p className="mt-2 text-sm text-white/75">
            A frontend-only marketplace prototype inspired by Parañaque&apos;s
            green civic identity. Demo vendors are fictional.
          </p>
        </div>
        <div>
          <p className="font-semibold">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <Link to="/customer/products" className="hover:text-gold">
                Browse products
              </Link>
            </li>
            <li>
              <Link to="/customer/orders" className="hover:text-gold">
                My orders
              </Link>
            </li>
            {FEATURE_TAWAD_ENABLED ? (
              <li>
                <Link to="/customer/offers" className="hover:text-gold">
                  My offers
                </Link>
              </li>
            ) : null}
            <li>
              <Link to="/vendor" className="hover:text-gold">
                Vendor portal
              </Link>
            </li>
            <li>
              <Link to="/admin" className="hover:text-gold">
                LGU Admin
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Prototype notes</p>
          <p className="mt-3 text-sm text-white/80">
            No real payments, delivery, or government endorsement. QR payment is
            simulated for demonstration only.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {BRAND_NAME} — Frontend prototype
      </div>
    </footer>
  )
}
