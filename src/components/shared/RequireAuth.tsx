import { Navigate, useLocation } from 'react-router-dom'
import { isApiConfigured } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

type AllowedRole = 'customer' | 'vendor' | 'lgu-admin'

function loginPathForRoles(roles?: AllowedRole[]): string {
  if (roles?.length === 1 && roles[0] === 'vendor') return '/vendor/login'
  if (roles?.length === 1 && roles[0] === 'lgu-admin') return '/admin/login'
  return '/auth'
}

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
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    )
  }

  if (!jwt || !user) {
    const next = `${location.pathname}${location.search}`
    const loginPath = loginPathForRoles(roles)
    return (
      <Navigate
        to={`${loginPath}?next=${encodeURIComponent(next)}`}
        replace
      />
    )
  }

  const knownRole =
    user.role === 'customer' ||
    user.role === 'vendor' ||
    user.role === 'lgu-admin'

  if (roles && knownRole && !roles.includes(user.role as AllowedRole)) {
    return <Navigate to={loginPathForRoles(roles)} replace />
  }

  return <>{children}</>
}
