import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Clock, MapPin, QrCode, Save, Star, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { DemoQrPlaceholder } from '@/components/shared/DemoQrPlaceholder'
import { EmptyState } from '@/components/shared/EmptyState'
import { PortalHeader } from '@/components/shared/PortalHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { useBranchStore } from '@/stores/branch-store'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useVendorStore } from '@/stores/vendor-store'
import {
  formatVendorTime,
  isVendorAcceptingOrders,
  parseTimeToMinutes,
} from '@/lib/vendor-hours'
import { cn } from '@/lib/utils'
import type { VendorUpdateInput } from '@/types'

interface FormErrors {
  name?: string
  description?: string
  location?: string
  opensAt?: string
  cutoffTime?: string
}

export default function VendorStorePage() {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const vendor = useVendorStore((s) =>
    s.vendors.find((v) => v.id === activeVendorId),
  )
  const updateVendor = useVendorStore((s) => s.updateVendor)
  const branches = useBranchStore((s) => s.branches)

  const [form, setForm] = useState<VendorUpdateInput>({
    name: '',
    description: '',
    location: '',
    isAvailable: true,
    opensAt: '06:00',
    cutoffTime: '17:00',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name,
        description: vendor.description,
        location: vendor.location,
        isAvailable: vendor.isAvailable,
        opensAt: vendor.opensAt,
        cutoffTime: vendor.cutoffTime,
      })
    }
  }, [vendor])

  if (!vendor) {
    return (
      <EmptyState
        icon={Store}
        title="Vendor not found"
        description="No active vendor selected. Please select a vendor from the demo switcher."
      />
    )
  }

  const branch = branches.find((b) => b.id === vendor.branchId)

  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = 'Store name is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    if (!form.location.trim()) errs.location = 'Location is required'
    if (parseTimeToMinutes(form.opensAt) === null) {
      errs.opensAt = 'Use a valid time (HH:mm)'
    }
    if (parseTimeToMinutes(form.cutoffTime) === null) {
      errs.cutoffTime = 'Use a valid time (HH:mm)'
    }
    const opens = parseTimeToMinutes(form.opensAt)
    const cutoff = parseTimeToMinutes(form.cutoffTime)
    if (opens !== null && cutoff !== null && cutoff <= opens) {
      errs.cutoffTime = 'Cut-off must be after opening time'
    }
    return errs
  }

  const handleSave = () => {
    const validation = validate()
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }
    const result = updateVendor(vendor.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      isAvailable: form.isAvailable,
      opensAt: form.opensAt,
      cutoffTime: form.cutoffTime,
    })
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    setErrors({})
    toast.success('Store profile updated')
  }

  const updateField = <K extends keyof VendorUpdateInput>(
    key: K,
    value: VendorUpdateInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const acceptingNow = isVendorAcceptingOrders({
    isAvailable: form.isAvailable,
    opensAt: form.opensAt,
    cutoffTime: form.cutoffTime,
  })

  return (
    <div className="space-y-6">
      <PortalHeader
        eyebrow="Vendor portal"
        title="Store profile"
        description="Update your store details, opening hours and order cut-off."
        actions={
          <Button size="lg" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <SectionCard title="Store details" icon={Store}>
            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <Label htmlFor="vs-name">Store name</Label>
                <Input
                  id="vs-name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
                {errors.name ? (
                  <p className="text-xs text-red-600">{errors.name}</p>
                ) : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="vs-desc">Description</Label>
                <Textarea
                  id="vs-desc"
                  rows={4}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
                {errors.description ? (
                  <p className="text-xs text-red-600">{errors.description}</p>
                ) : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="vs-loc">Stall location</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="vs-loc"
                    className="pl-10"
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                  />
                </div>
                {errors.location ? (
                  <p className="text-xs text-red-600">{errors.location}</p>
                ) : branch ? (
                  <p className="text-xs text-muted">
                    Part of {branch.name}. Keri pickup uses the palengke&apos;s
                    pin, not your stall label.
                  </p>
                ) : null}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Hours & availability" icon={Clock}>
            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="vs-opens">Opens at</Label>
                  <Input
                    id="vs-opens"
                    type="time"
                    value={form.opensAt}
                    onChange={(e) => updateField('opensAt', e.target.value)}
                  />
                  {errors.opensAt ? (
                    <p className="text-xs text-red-600">{errors.opensAt}</p>
                  ) : null}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="vs-cutoff">Order cut-off</Label>
                  <Input
                    id="vs-cutoff"
                    type="time"
                    value={form.cutoffTime}
                    onChange={(e) => updateField('cutoffTime', e.target.value)}
                  />
                  {errors.cutoffTime ? (
                    <p className="text-xs text-red-600">{errors.cutoffTime}</p>
                  ) : (
                    <p className="text-xs text-muted">
                      Customers cannot place new orders after this time.
                    </p>
                  )}
                </div>
              </div>

              <label
                htmlFor="vs-avail"
                className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-warm-white/70 px-4 py-3.5"
              >
                <span>
                  <span className="block text-sm font-bold text-primary-deep">
                    Store is open
                  </span>
                  <span className="block text-xs text-muted">
                    Turn off to pause all new orders, regardless of the hours above.
                  </span>
                </span>
                <Switch
                  id="vs-avail"
                  checked={form.isAvailable}
                  onCheckedChange={(checked) => updateField('isAvailable', checked)}
                />
              </label>
            </div>
          </SectionCard>

          <div className="flex justify-end lg:hidden">
            <Button size="lg" onClick={handleSave} className="w-full sm:w-auto">
              <Save className="h-4 w-4" />
              Save changes
            </Button>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-deep to-primary p-5 text-white shadow-[var(--shadow-lift)]">
            <span
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-lime/25 blur-2xl"
              aria-hidden
            />
            <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-lime">
              Live status
            </p>
            <div className="relative mt-2 flex items-center gap-2.5">
              <span
                className={cn(
                  'h-3 w-3 rounded-full',
                  acceptingNow ? 'bg-lime shadow-[0_0_0_4px] shadow-lime/30' : 'bg-white/40',
                )}
              />
              <p className="text-xl font-extrabold">
                {acceptingNow ? 'Accepting orders' : 'Not accepting orders'}
              </p>
            </div>
            <p className="relative mt-3 text-xs leading-relaxed text-white/75">
              Hours: {formatVendorTime(form.opensAt)} – cut-off{' '}
              {formatVendorTime(form.cutoffTime)}. Past cut-off, your stall is
              disabled on the customer side.
            </p>
            <div className="relative mt-4 flex items-center gap-1.5 text-xs font-semibold text-white/90">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              {vendor.rating.toFixed(1)} store rating
            </div>
          </div>

          <SectionCard title="Payment QR code" icon={QrCode}>
            <DemoQrPlaceholder label={vendor.demoQrLabel} />
            <p className="mt-3 text-center text-xs text-muted">
              Customers scan this QR to submit their demo payment.
            </p>
          </SectionCard>
        </aside>
      </div>
    </div>
  )
}
