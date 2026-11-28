import { Navigate, useLocation } from 'react-router-dom'
import { isApiConfigured } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { BrandLoader } from '@/components/shared/BrandLoader'

type AllowedRole = 'customer' | 'vendor' | 'lgu-admin'

const LOGIN_PATH = '/auth'

export function RequireAuth({
  roles,
  children,
}: {
  roles?: AllowedRole[]
  children: React.ReactNode
}) {
  const location = useLocation()
  const hydrated = useAuthStore((s) => s.hydrated)
  const user = useAuthStore((s) => s.user)
  const jwt = useAuthStore((s) => s.jwt)

  if (!isApiConfigured()) return <>{children}</>
  if (!hydrated) {
    return <BrandLoader label="Checking session" />
  }

  if (!jwt || !user) {
    const next = `${location.pathname}${location.search}`
    return (
      <Navigate to={`${LOGIN_PATH}?next=${encodeURIComponent(next)}`} replace />
    )
  }

  const knownRole =
    user.role === 'customer' ||
    user.role === 'vendor' ||
    user.role === 'lgu-admin'

  if (roles && (!knownRole || !roles.includes(user.role as AllowedRole))) {
    return <Navigate to={LOGIN_PATH} replace />
  }

  return <>{children}</>
}
