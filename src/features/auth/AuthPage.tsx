import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { PartnerLogos } from '@/components/shared/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BRAND_NAME, BRAND_TAGLINE } from '@/constants'
import { isApiConfigured, type AuthRole } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

export type AuthPortal = 'customer' | 'vendor' | 'lgu-admin'

const PORTAL_META: Record<
  AuthPortal,
  {
    eyebrow: string
    title: string
    blurb: string
    formTitle: string
    formHint: string
    home: string
    allowRegister: boolean
  }
> = {
  customer: {
    eyebrow: 'Customer storefront',
    title: BRAND_NAME,
    blurb: BRAND_TAGLINE,
    formTitle: 'Welcome back',
    formHint: 'Sign in to shop, checkout, and track your orders.',
    home: '/customer',
    allowRegister: true,
  },
  vendor: {
    eyebrow: 'Vendor portal',
    title: 'Vendor workspace',
    blurb: 'Manage your stall, stock, payments, and Keri handoff.',
    formTitle: 'Vendor sign in',
    formHint: 'Use the account assigned to your stall by the LGU.',
    home: '/vendor',
    allowRegister: false,
  },
  'lgu-admin': {
    eyebrow: 'LGU administration',
    title: 'LGU Admin',
    blurb: 'Market branches, commodity ranges, vendors, and monitoring.',
    formTitle: 'LGU sign in',
    formHint: 'Authorized LGU administrator accounts only.',
    home: '/admin',
    allowRegister: false,
  },
}

function isKnownRole(role: string | null | undefined): role is AuthRole {
  return role === 'customer' || role === 'vendor' || role === 'lgu-admin'
}

function resolvePostLoginPath(
  portal: AuthPortal,
  next: string,
  home: string,
): string {
  if (!next) return home
  if (next.includes('/login') || next === '/auth' || next.startsWith('/auth?')) {
    return home
  }
  // Customer profile is not the default landing after sign-in.
  if (
    portal === 'customer' &&
    (next === '/customer/profile' || next.startsWith('/customer/profile?'))
  ) {
    return home
  }
  return next
}

function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  minLength,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  placeholder?: string
  minLength?: number
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        className="h-12 pr-11"
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition hover:text-primary-deep"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export default function AuthPage({ portal }: { portal: AuthPortal }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || ''
  const modeParam = params.get('mode')
  const meta = PORTAL_META[portal]
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const logout = useAuthStore((s) => s.logout)

  const [mode, setMode] = useState<'login' | 'register'>(
    meta.allowRegister && modeParam === 'register' ? 'register' : 'login',
  )
  const [busy, setBusy] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const result = await login(identifier, password, portal)
    setBusy(false)
    if (!result.ok) {
      toast.error(result.message)
      return
    }

    const role = useAuthStore.getState().user?.role
    if (isKnownRole(role) && role !== portal) {
      logout()
      toast.error(
        portal === 'vendor'
          ? 'This account is not a vendor account.'
          : portal === 'lgu-admin'
            ? 'This account is not an LGU admin account.'
            : 'This account cannot use the customer storefront login.',
      )
      return
    }

    toast.success('Signed in')
    navigate(resolvePostLoginPath(portal, next, meta.home), { replace: true })
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    if (!meta.allowRegister) return
    setBusy(true)
    const result = await register({
      username: username.trim() || email.trim().split('@')[0] || 'customer',
      email: email.trim(),
      password,
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
    })
    setBusy(false)
    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success('Account created. Please sign in.')
    setMode('login')
    setIdentifier('')
    setPassword('')
    setName('')
    setPhone('')
    setUsername('')
    setEmail('')
    // Drop any stale ?next= so the following sign-in lands on the portal home.
    navigate('/auth', { replace: true })
  }

  if (!isApiConfigured()) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-warm-white px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-extrabold text-primary-deep">
            Sign in unavailable
          </h1>
          <p className="mt-2 text-sm text-muted">
            Set <code className="text-primary">VITE_API_URL</code> to connect to
            the API.
          </p>
        </div>
      </div>
    )
  }

  const showLogin = mode === 'login' || !meta.allowRegister

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <AuthAtmosphere />

      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-16">
        <div className="animate-hero-in text-white">
          {portal === 'customer' ? (
            <Link
              to="/customer"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to storefront
            </Link>
          ) : (
            <p className="mb-8 text-sm font-semibold text-white/60">
              Staff access only
            </p>
          )}

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-lime">
            {meta.eyebrow}
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {meta.title}
          </h1>
          <p className="mt-4 max-w-md text-base text-white/85 sm:text-lg">
            {meta.blurb}
          </p>
          <p className="mt-3 max-w-md text-sm text-white/70">
            {portal === 'customer'
              ? 'Create a customer account here. Vendor and LGU accounts are provisioned separately.'
              : 'Accounts for this portal are provisioned by the LGU.'}
          </p>

          <div className="mt-10 hidden max-w-xl rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm lg:block">
            <PartnerLogos className="justify-start gap-x-8 gap-y-4" />
          </div>
        </div>

        <div className="animate-hero-in animate-hero-in-delay-1 w-full max-w-md justify-self-center lg:justify-self-end">
          <div className="rounded-3xl bg-white p-7 shadow-[0_30px_80px_-24px_rgb(0_0_0/0.55)] sm:p-9">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-primary-deep">
              {showLogin ? meta.formTitle : 'Create your account'}
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              {showLogin
                ? meta.formHint
                : 'Register as a customer to shop, checkout, and chat with vendors.'}
            </p>

            {meta.allowRegister ? (
              <div
                className="mt-6 flex gap-7 border-b border-border"
                role="tablist"
                aria-label="Account mode"
              >
                {(['login', 'register'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={mode === tab}
                    onClick={() => setMode(tab)}
                    className={cn(
                      '-mb-px border-b-2 pb-3 text-sm font-bold transition',
                      mode === tab
                        ? 'border-primary text-primary-deep'
                        : 'border-transparent text-muted hover:text-primary-deep',
                    )}
                  >
                    {tab === 'login' ? 'Sign in' : 'Register'}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-6">
              {showLogin ? (
                <form className="space-y-5" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="auth-identifier">Email or username</Label>
                    <Input
                      id="auth-identifier"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="username"
                      placeholder="you@example.com"
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auth-password">Password</Label>
                    <PasswordField
                      id="auth-password"
                      value={password}
                      onChange={setPassword}
                      autoComplete="current-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="mt-2 h-12 w-full"
                    disabled={busy}
                  >
                    {busy ? 'Signing in…' : 'Sign in'}
                  </Button>
                </form>
              ) : (
                <form className="space-y-5" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full name</Label>
                    <Input
                      id="reg-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Juan Dela Cruz"
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Username</Label>
                      <Input
                        id="reg-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Optional"
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone">Phone</Label>
                      <Input
                        id="reg-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09XXXXXXXXX"
                        className="h-12"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <PasswordField
                      id="reg-password"
                      value={password}
                      onChange={setPassword}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      minLength={8}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="mt-2 h-12 w-full"
                    disabled={busy}
                  >
                    {busy ? 'Creating…' : 'Create account'}
                  </Button>
                </form>
              )}

              {portal === 'customer' ? (
                <p className="mt-6 text-center text-sm text-muted">
                  Just browsing?{' '}
                  <Link
                    to="/customer"
                    className="font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    Continue to the storefront
                  </Link>
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm lg:hidden">
            <PartnerLogos className="gap-x-8 gap-y-4" />
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthAtmosphere() {
  return (
    <div className="absolute inset-0" aria-hidden>
      <img
        src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1920&q=80"
        alt=""
        className="h-full w-full scale-105 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-deep/96 via-primary-deep/88 to-primary/75" />
      <div className="absolute -right-24 top-1/5 h-[26rem] w-[26rem] rounded-full bg-lime/20 blur-3xl" />
      <div className="absolute -bottom-32 left-1/5 h-[24rem] w-[24rem] rounded-full bg-bay/25 blur-3xl" />
      <div className="brand-ribbon absolute inset-x-0 bottom-0 h-1.5" />
    </div>
  )
}
