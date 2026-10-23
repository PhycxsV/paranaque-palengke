import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { DemoQrPlaceholder } from '@/components/shared/DemoQrPlaceholder'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useVendorStore } from '@/stores/vendor-store'
import type { VendorProfileInput } from '@/types'

interface FormErrors {
  name?: string
  description?: string
  location?: string
}

export default function VendorStorePage() {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const vendor = useVendorStore((s) =>
    s.vendors.find((v) => v.id === activeVendorId),
  )
  const updateVendor = useVendorStore((s) => s.updateVendor)

  const [form, setForm] = useState<VendorProfileInput>({
    name: '',
    description: '',
    location: '',
    isAvailable: true,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name,
        description: vendor.description,
        location: vendor.location,
        isAvailable: vendor.isAvailable,
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

  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = 'Store name is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    if (!form.location.trim()) errs.location = 'Location is required'
    return errs
  }

  const handleSave = () => {
    const validation = validate()
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }
    updateVendor(vendor.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      isAvailable: form.isAvailable,
    })
    setErrors({})
    toast.success('Store profile updated')
  }

  const updateField = <K extends keyof VendorProfileInput>(
    key: K,
    value: VendorProfileInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-deep">
          Store profile
        </h1>
        <p className="mt-1 text-sm text-muted">
          Update your store details and availability
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Store details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
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
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
              {errors.description ? (
                <p className="text-xs text-red-600">{errors.description}</p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vs-loc">Location</Label>
              <Input
                id="vs-loc"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
              {errors.location ? (
                <p className="text-xs text-red-600">{errors.location}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="vs-avail"
                checked={form.isAvailable}
                onCheckedChange={(checked) =>
                  updateField('isAvailable', checked)
                }
              />
              <Label htmlFor="vs-avail">Store is open / available</Label>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4" />
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment QR code</CardTitle>
            </CardHeader>
            <CardContent>
              <DemoQrPlaceholder label={vendor.demoQrLabel} />
              <p className="mt-3 text-center text-xs text-muted">
                Customers scan this QR to submit their demo payment.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${vendor.isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`}
                />
                <span className="text-sm font-medium text-ink">
                  {vendor.isAvailable ? 'Open' : 'Closed'}
                </span>
              </div>
              <p className="text-xs text-muted">
                {vendor.isAvailable
                  ? 'Your store is visible and accepting orders.'
                  : 'Your store is currently hidden from customers.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
