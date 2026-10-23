import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BRAND_NAME } from '@/constants'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold text-primary-deep">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        The page you're looking for doesn't exist in {BRAND_NAME}. It may have been moved
        or removed.
      </p>
      <Button asChild className="mt-6" size="lg">
        <Link to="/customer">
          <Home className="h-5 w-5" />
          Back to Home
        </Link>
      </Button>
    </div>
  )
}
