import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, MapPin, Plus, Store } from 'lucide-react'
import { toast } from 'sonner'
import { CATEGORIES } from '@/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/shared/EmptyState'
import { useBranchStore } from '@/stores/branch-store'
import { useVendorStore } from '@/stores/vendor-store'
import type { ProductCategory, VendorCreateInput } from '@/types'

const DEFAULT_VENDOR_FORM: VendorCreateInput = {
  name: '',
  description: '',
  location: '',
  branchId: '',
  categories: [],
  imageUrl: '',
  opensAt: '05:00',
  cutoffTime: '17:00',
  demoQrLabel: '',
  isAvailable: true,
  rating: 4.5,
}

function CreateVendorDialog() {
  const addVendor = useVendorStore((s) => s.addVendor)
  const allBranches = useBranchStore((s) => s.branches)
  const branches = useMemo(
    () => allBranches.filter((b) => b.isActive),
    [allBranches],
  )
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<VendorCreateInput>(DEFAULT_VENDOR_FORM)

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setForm({
        ...DEFAULT_VENDOR_FORM,
        branchId: branches[0]?.id ?? '',
      })
    }
    setOpen(isOpen)
  }

  const toggleCategory = (category: ProductCategory) => {
    setForm((f) => {
      const has = f.categories.includes(category)
      return {
        ...f,
        categories: has
          ? f.categories.filter((c) => c !== category)
          : [...f.categories, category],
      }
    })
  }

  const handleSave = () => {
    const result = addVendor(form)
    if (result.ok) {
      toast.success(`Added vendor ${result.vendor.name}`)
      setOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create vendor</DialogTitle>
          <DialogDescription>
            Register a new marketplace vendor for the demo.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="vendor-name">Name</Label>
            <Input
              id="vendor-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Aling Nena's Stall"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vendor-desc">Description</Label>
            <Textarea
              id="vendor-desc"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              placeholder="What this stall is known for"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vendor-branch">Palengke / market</Label>
            <select
              id="vendor-branch"
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={form.branchId}
              onChange={(e) =>
                setForm((f) => ({ ...f, branchId: e.target.value }))
              }
            >
              <option value="">Select palengke…</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted">
              Keri pickup uses this palengke’s lon/lat — not the stall.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vendor-location">Stall label</Label>
            <Input
              id="vendor-location"
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              placeholder="e.g. Stall A12 / Row B"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vendor-rating">Rating (1–5)</Label>
            <Input
              id="vendor-rating"
              type="number"
              min={1}
              max={5}
              step={0.1}
              value={form.rating}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  rating: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const selected = form.categories.includes(cat)
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                      selected
                        ? 'border-primary bg-primary-50 text-primary-deep'
                        : 'border-border bg-surface text-muted hover:border-primary/40'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-muted">Select at least one category.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vendor-image">Image URL</Label>
            <Input
              id="vendor-image"
              value={form.imageUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, imageUrl: e.target.value }))
              }
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-opens">Opens at</Label>
              <Input
                id="vendor-opens"
                type="time"
                value={form.opensAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, opensAt: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-cutoff">Cutoff time</Label>
              <Input
                id="vendor-cutoff"
                type="time"
                value={form.cutoffTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cutoffTime: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vendor-qr">Demo QR label</Label>
            <Input
              id="vendor-qr"
              value={form.demoQrLabel}
              onChange={(e) =>
                setForm((f) => ({ ...f, demoQrLabel: e.target.value }))
              }
              placeholder="e.g. QRPH · Aling Nena"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="vendor-available"
              checked={form.isAvailable}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, isAvailable: checked }))
              }
            />
            <Label htmlFor="vendor-available">Available for orders</Label>
          </div>
        </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Create vendor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminVendorsPage() {
  const vendors = useVendorStore((s) => s.vendors)
  const branches = useBranchStore((s) => s.branches)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-deep">
            Vendor Directory
          </h1>
          <p className="mt-1 text-sm text-muted">
            All registered marketplace vendors
          </p>
        </div>
        <CreateVendorDialog />
      </div>

      {vendors.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No vendors"
          description="No vendors are registered in the demo yet."
        />
      ) : (
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              to={`/admin/vendors/${vendor.id}`}
              className="h-full"
            >
              <Card className="group flex h-full flex-col transition hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          {vendor.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 flex items-start gap-1">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>
                            {branches.find((b) => b.id === vendor.branchId)
                              ?.name ?? 'Unassigned palengke'}{' '}
                            · {vendor.location}
                          </span>
                        </CardDescription>
                        <p className="mt-0.5 text-xs text-muted">
                          ★ {vendor.rating.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5" />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="mb-3 line-clamp-2 min-h-[2.5rem] text-xs text-muted">
                    {vendor.description}
                  </p>
                  <div className="mt-auto flex min-h-[3.25rem] flex-wrap content-start gap-1.5">
                    <Badge variant={vendor.isAvailable ? 'success' : 'muted'}>
                      {vendor.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                    {vendor.categories.slice(0, 2).map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                    {vendor.categories.length > 2 && (
                      <Badge variant="outline">
                        +{vendor.categories.length - 2}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
