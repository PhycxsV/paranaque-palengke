import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check, MapPin, Phone, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
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

export default function CustomerProfilePage() {
  const profile = useCustomerProfileStore((s) => s.profile)
  const hasSaved = useCustomerProfileStore((s) => s.hasSaved)
  const updateProfile = useCustomerProfileStore((s) => s.updateProfile)

  const [form, setForm] = useState<CustomerProfile>(profile)

  useEffect(() => {
    setForm(profile)
  }, [profile])

  const dirty =
    form.name !== profile.name ||
    form.contactNumber !== profile.contactNumber ||
    form.deliveryAddress !== profile.deliveryAddress ||
    form.notes !== profile.notes

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please enter your name.')
      return
    }
    if (!form.contactNumber.trim()) {
      toast.error('Please enter your contact number.')
      return
    }
    if (!form.deliveryAddress.trim()) {
      toast.error('Please enter your drop-off address.')
      return
    }
    updateProfile(form)
    toast.success('Profile saved. Checkout will use these details.')
  }

  return (
    <>
      <PageHeader
        width="default"
        eyebrow="Account"
        title="My profile"
        description="Saved details used when you check out — name, contact, and drop-off address."
      />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <SectionCard title="Customer" icon={UserRound}>
          <div className="mb-6 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100 font-display text-xl font-extrabold text-primary-deep">
              {initials(form.name || profile.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold text-primary-deep">
                {form.name.trim() || 'Your name'}
              </p>
              <p className="text-sm text-muted">
                {hasSaved
                  ? 'Saved on this device for demo checkouts.'
                  : 'Not saved yet — fill this in once and checkout will prefill.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="profile-name">Full name *</Label>
              <Input
                id="profile-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Juan dela Cruz"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="profile-contact">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Contact number *
                </span>
              </Label>
              <Input
                id="profile-contact"
                value={form.contactNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactNumber: e.target.value }))
                }
                placeholder="09XX XXX XXXX"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="profile-address">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Drop-off address *
                </span>
              </Label>
              <Textarea
                id="profile-address"
                value={form.deliveryAddress}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deliveryAddress: e.target.value }))
                }
                placeholder="House/unit no., street, barangay, landmark…"
                rows={3}
                required
              />
              <p className="text-xs text-muted">
                Where Keri should deliver your orders.
              </p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="profile-notes">Default notes (optional)</Label>
              <Textarea
                id="profile-notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="e.g. Leave with guard, call on arrival…"
                rows={2}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" disabled={!dirty && hasSaved}>
                <Check className="h-4 w-4" />
                {hasSaved ? 'Save changes' : 'Save profile'}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link to="/customer/orders">View my orders</Link>
              </Button>
            </div>
          </form>
        </SectionCard>
      </div>
    </>
  )
}
