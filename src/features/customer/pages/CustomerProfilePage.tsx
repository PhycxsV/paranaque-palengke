import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Camera,
  Check,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Trash2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { MapPinPicker, DEFAULT_DROPOFF_PIN } from '@/components/shared/MapPinPicker'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { isApiConfigured } from '@/lib/api'
import {
  formatCoordinate,
  mapPinFromText,
  parseDropoffCoordinates,
} from '@/lib/coordinates'
import { readProfilePhoto } from '@/lib/profile-photo'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import {
  hydrateCustomerProfile,
  persistCustomerProfile,
  useCustomerProfileStore,
  type CustomerProfile,
} from '@/stores/customer-profile-store'

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  )
}

function withPhotoDefaults(profile: CustomerProfile): CustomerProfile {
  return { ...profile, photoUrl: profile.photoUrl ?? '' }
}

export default function CustomerProfilePage() {
  const navigate = useNavigate()
  const authUser = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const profile = useCustomerProfileStore((s) => s.profile)
  const hasSaved = useCustomerProfileStore((s) => s.hasSaved)
  const updateProfile = useCustomerProfileStore((s) => s.updateProfile)
  const fileRef = useRef<HTMLInputElement>(null)

  const accountName = authUser?.name?.trim() || ''
  const accountEmail = authUser?.email?.trim() || ''
  const accountPhone = authUser?.phone?.trim() || ''

  const [form, setFormRaw] = useState<CustomerProfile>(() => withPhotoDefaults(profile))
  const [latText, setLatTextRaw] = useState(() => formatCoordinate(profile.dropoffLat))
  const [lngText, setLngTextRaw] = useState(() => formatCoordinate(profile.dropoffLng))
  const [photoBusy, setPhotoBusy] = useState(false)
  const [saving, setSaving] = useState(false)

  // the profile gets refetched a few times when the page opens (session
  // restore, hydrate). if that lands after the customer already picked a
  // place, it wiped their pick. so remember when they touched anything and
  // stop overwriting the form after that
  const touchedRef = useRef(false)
  const setForm: typeof setFormRaw = (value) => {
    touchedRef.current = true
    setFormRaw(value)
  }
  const setLatText: typeof setLatTextRaw = (value) => {
    touchedRef.current = true
    setLatTextRaw(value)
  }
  const setLngText: typeof setLngTextRaw = (value) => {
    touchedRef.current = true
    setLngTextRaw(value)
  }

  useEffect(() => {
    if (touchedRef.current) return
    setFormRaw(withPhotoDefaults(profile))
    setLatTextRaw(formatCoordinate(profile.dropoffLat))
    setLngTextRaw(formatCoordinate(profile.dropoffLng))
  }, [profile])

  useEffect(() => {
    if (!isApiConfigured() || !authUser) return
    void hydrateCustomerProfile()
  }, [authUser])

  useEffect(() => {
    const patch: Partial<CustomerProfile> = {}
    if (accountName && profile.name.trim() !== accountName) {
      patch.name = accountName
    }
    if (accountPhone && profile.contactNumber.trim() !== accountPhone) {
      patch.contactNumber = accountPhone
    }
    if (Object.keys(patch).length > 0) updateProfile(patch)
  }, [
    accountName,
    accountPhone,
    profile.name,
    profile.contactNumber,
    updateProfile,
  ])

  const dirty =
    form.deliveryAddress !== (profile.deliveryAddress ?? '') ||
    form.dropoffLandmark !== (profile.dropoffLandmark ?? '') ||
    form.dropoffPlace !== (profile.dropoffPlace ?? '') ||
    latText.trim() !== formatCoordinate(profile.dropoffLat) ||
    lngText.trim() !== formatCoordinate(profile.dropoffLng) ||
    form.notes !== (profile.notes ?? '') ||
    form.photoUrl !== (profile.photoUrl ?? '')

  async function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    try {
      const result = await readProfilePhoto(file)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setForm((f) => ({ ...f, photoUrl: result.dataUrl }))
      toast.success('Photo ready — save your profile to keep it.')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const phone = accountPhone || form.contactNumber.trim()
    if (!phone) {
      toast.error('No phone on your account. Register again with a phone number.')
      return
    }
    if (!form.deliveryAddress.trim()) {
      toast.error('Please enter your drop-off address.')
      return
    }
    const coordinates = parseDropoffCoordinates(latText, lngText)
    if (!coordinates.ok) {
      toast.error(coordinates.message)
      return
    }

    const next = {
      ...form,
      name: accountName || form.name,
      contactNumber: phone,
      dropoffLat: coordinates.lat,
      dropoffLng: coordinates.lng,
    }
    // Local cache first so the form never loses edits if the API is unreachable.
    // saved now, so it's fine for the form to follow the profile again
    touchedRef.current = false
    updateProfile(next)

    if (!isApiConfigured() || !authUser) {
      toast.success('Profile saved. Checkout will use these details.')
      return
    }

    setSaving(true)
    try {
      await persistCustomerProfile({
        deliveryAddress: next.deliveryAddress,
        dropoffLat: next.dropoffLat,
        dropoffLng: next.dropoffLng,
        dropoffLandmark: next.dropoffLandmark,
        dropoffPlace: next.dropoffPlace,
        notes: next.notes,
      })
      toast.success('Profile saved. Checkout will use these details.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Saved on this device only: ${error.message}`
          : 'Saved on this device only. Could not reach the server.',
      )
    } finally {
      setSaving(false)
    }
  }

  function handleSignOut() {
    logout()
    toast.success('Signed out')
    navigate('/auth', { replace: true })
  }

  const displayName = accountName || form.name.trim() || 'Your name'

  const signedIn = isApiConfigured() && Boolean(authUser)

  return (
    <>
      <PageHeader
        width="wide"
        eyebrow="Account"
        title="My profile"
        description="Your account details and the drop-off spot we use at checkout."
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          {/* Left rail: who you are */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <SectionCard bodyClassName="p-0">
              <div className="h-16 bg-gradient-to-br from-primary-deep via-primary-deep to-primary" />
              <div className="px-5 pb-5 sm:px-6">
                <div className="-mt-10 flex items-end gap-4">
                  <div className="relative h-20 w-20 shrink-0">
                    {form.photoUrl ? (
                      <img
                        src={form.photoUrl}
                        alt=""
                        className="h-full w-full rounded-2xl object-cover ring-4 ring-surface"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center rounded-2xl bg-primary-100 font-display text-2xl font-extrabold text-primary-deep ring-4 ring-surface">
                        {initials(displayName)}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={photoBusy}
                      onClick={() => fileRef.current?.click()}
                      aria-label="Upload profile photo"
                      className={cn(
                        'absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:bg-primary-deep',
                        photoBusy && 'opacity-60',
                      )}
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={photoBusy}
                      onClick={() => fileRef.current?.click()}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {form.photoUrl ? 'Change' : 'Upload'}
                    </Button>
                    {form.photoUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setForm((f) => ({ ...f, photoUrl: '' }))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={onPickPhoto}
                  />
                </div>

                <div className="mt-4 min-w-0">
                  <p className="truncate text-lg font-extrabold text-primary-deep">
                    {displayName}
                  </p>
                  {!signedIn ? (
                    <p className="truncate text-sm text-muted">
                      Sign in to load your account details.
                    </p>
                  ) : null}
                </div>

                <dl className="mt-4 divide-y divide-border rounded-xl border border-border bg-warm-white/60 text-sm">
                  <div className="flex items-center gap-3 px-3.5 py-2.5">
                    <User className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">
                        Full name
                      </dt>
                      <dd className="truncate font-semibold text-primary-deep">
                        {accountName || form.name.trim() || '—'}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-3.5 py-2.5">
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">
                        Email
                      </dt>
                      <dd className="truncate font-semibold text-primary-deep">
                        {accountEmail || '—'}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-3.5 py-2.5">
                    <Phone className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">
                        Phone
                      </dt>
                      <dd className="truncate font-semibold text-primary-deep">
                        {accountPhone || form.contactNumber || '—'}
                      </dd>
                    </div>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted">
                  Account fields come from your login. Photo is stored on this
                  device.
                </p>

                <div className="mt-4 grid gap-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/customer/orders">
                      <Package className="h-4 w-4" />
                      View my orders
                    </Link>
                  </Button>
                  {signedIn ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  ) : null}
                </div>
              </div>
            </SectionCard>
          </aside>

          {/* Main: delivery details, map beside the fields on wide screens */}
          <SectionCard title="Delivery details" icon={MapPin}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="space-y-3">
                  <MapPinPicker
                    {...mapPinFromText(latText, lngText, DEFAULT_DROPOFF_PIN)}
                    initialSearch={profile.dropoffPlace}
                    onChange={({ lat, lng }) => {
                      setLatText(formatCoordinate(lat))
                      setLngText(formatCoordinate(lng))
                      setForm((f) => ({
                        ...f,
                        dropoffLat: lat,
                        dropoffLng: lng,
                      }))
                    }}
                    onPlaceSelected={({ address, lat, lng }) => {
                      setLatText(formatCoordinate(lat))
                      setLngText(formatCoordinate(lng))
                      setForm((f) => ({
                        ...f,
                        deliveryAddress: f.deliveryAddress.trim()
                          ? f.deliveryAddress
                          : address,
                        dropoffPlace: address,
                        dropoffLat: lat,
                        dropoffLng: lng,
                      }))
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="profile-address">Drop-off address *</Label>
                    <Textarea
                      id="profile-address"
                      value={form.deliveryAddress}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          deliveryAddress: e.target.value,
                        }))
                      }
                      placeholder="House/unit no., street, barangay, landmark…"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="profile-landmark">Landmark</Label>
                    <Input
                      id="profile-landmark"
                      value={form.dropoffLandmark}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dropoffLandmark: e.target.value,
                        }))
                      }
                      placeholder="e.g. Beside the blue gate, near the chapel"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="profile-notes">
                      Default notes (optional)
                    </Label>
                    <Textarea
                      id="profile-notes"
                      value={form.notes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      placeholder="e.g. Leave with guard, call on arrival…"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <div className="grid gap-1.5">
                      <Label htmlFor="profile-lat">Latitude</Label>
                      <Input
                        id="profile-lat"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min={-90}
                        max={90}
                        value={latText}
                        onChange={(e) => setLatText(e.target.value)}
                        placeholder="14.4793"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="profile-lng">Longitude</Label>
                      <Input
                        id="profile-lng"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min={-180}
                        max={180}
                        value={lngText}
                        onChange={(e) => setLngText(e.target.value)}
                        placeholder="121.0198"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="col-span-2 sm:col-span-1"
                      disabled={saving || (!dirty && hasSaved)}
                    >
                      <Check className="h-4 w-4" />
                      {saving
                        ? 'Saving…'
                        : hasSaved
                          ? 'Save changes'
                          : 'Save profile'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted">
                    Search or drag the pin for your drop-off. Landmark and pin
                    are required at checkout.{' '}
                    <span className="font-semibold text-primary-deep">
                      {dirty || !hasSaved
                        ? 'You have unsaved changes.'
                        : 'All changes saved.'}
                    </span>
                  </p>
                </div>
              </div>
            </form>
          </SectionCard>
        </div>
      </div>
    </>
  )
}
