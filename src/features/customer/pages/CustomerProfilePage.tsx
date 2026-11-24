import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AtSign,
  Camera,
  Check,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Trash2,
  UserRound,
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

  const accountName =
    authUser?.name?.trim() || authUser?.username?.trim() || ''
  const accountEmail = authUser?.email?.trim() || ''
  const accountUsername = authUser?.username?.trim() || ''
  const accountPhone = authUser?.phone?.trim() || ''

  const [form, setForm] = useState<CustomerProfile>(() => withPhotoDefaults(profile))
  const [latText, setLatText] = useState(() => formatCoordinate(profile.dropoffLat))
  const [lngText, setLngText] = useState(() => formatCoordinate(profile.dropoffLng))
  const [photoBusy, setPhotoBusy] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(withPhotoDefaults(profile))
    setLatText(formatCoordinate(profile.dropoffLat))
    setLngText(formatCoordinate(profile.dropoffLng))
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

  return (
    <>
      <PageHeader
        width="default"
        eyebrow="Account"
        title="My profile"
        description="Account details from your sign-in, plus local delivery preferences for checkout."
      />

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Account" icon={UserRound}>
            <div className="mb-4 flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                {form.photoUrl ? (
                  <img
                    src={form.photoUrl}
                    alt=""
                    className="h-full w-full rounded-2xl object-cover ring-2 ring-primary/15"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-2xl bg-primary-100 font-display text-2xl font-extrabold text-primary-deep">
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

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-extrabold text-primary-deep">
                  {displayName}
                </p>
                <p className="truncate text-sm text-muted">
                  {accountUsername
                    ? `@${accountUsername}`
                    : 'Sign in to load your account details.'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
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
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={onPickPhoto}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="account-name">Full name</Label>
                <Input
                  id="account-name"
                  value={accountName}
                  readOnly
                  disabled
                  placeholder="From your account"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="account-username">
                  <span className="inline-flex items-center gap-1.5">
                    <AtSign className="h-3.5 w-3.5" />
                    Username
                  </span>
                </Label>
                <Input
                  id="account-username"
                  value={accountUsername}
                  readOnly
                  disabled
                  placeholder="From your account"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="account-email">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </span>
                </Label>
                <Input
                  id="account-email"
                  value={accountEmail}
                  readOnly
                  disabled
                  placeholder="From your account"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="account-phone">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Phone
                  </span>
                </Label>
                <Input
                  id="account-phone"
                  value={accountPhone || form.contactNumber}
                  readOnly
                  disabled
                  placeholder="From your account"
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              Account fields come from your login. Photo is stored on this device.
            </p>
          </SectionCard>

          <SectionCard title="Delivery details" icon={MapPin}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5 sm:col-span-2">
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
                    rows={3}
                    required
                  />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
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
                <div className="sm:col-span-2">
                  <MapPinPicker
                    {...mapPinFromText(latText, lngText, DEFAULT_DROPOFF_PIN)}
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
                        dropoffLat: lat,
                        dropoffLng: lng,
                      }))
                    }}
                  />
                </div>
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
                <p className="text-xs text-muted sm:col-span-2">
                  Search or drag the pin for your drop-off. Landmark and pin are
                  required at checkout.
                </p>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="profile-notes">Default notes (optional)</Label>
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
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button type="submit" disabled={saving || (!dirty && hasSaved)}>
                  <Check className="h-4 w-4" />
                  {saving ? 'Saving…' : hasSaved ? 'Save changes' : 'Save profile'}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link to="/customer/orders">View my orders</Link>
                </Button>
              </div>
            </form>
          </SectionCard>
        </div>

        {isApiConfigured() && authUser ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-3">
            <p className="text-sm text-muted">
              Signed in as{' '}
              <span className="font-semibold text-primary-deep">
                {accountEmail || accountUsername}
              </span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        ) : null}
      </div>
    </>
  )
}
