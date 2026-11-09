import { useState } from 'react'
import { MapPin, Plus, Save } from 'lucide-react'
import { toast } from 'sonner'
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
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/shared/EmptyState'
import { useBranchStore } from '@/stores/branch-store'
import type { Branch, BranchFormInput } from '@/types'

const DEFAULT_FORM: BranchFormInput = {
  name: '',
  address: '',
  lat: 14.4793,
  lng: 121.0198,
  isActive: true,
}

function BranchFormFields({
  form,
  setForm,
  idPrefix,
}: {
  form: BranchFormInput
  setForm: (next: BranchFormInput) => void
  idPrefix: string
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-name`}>Palengke name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Baclaran Public Market"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-address`}>Address</Label>
        <Input
          id={`${idPrefix}-address`}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Area / city"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-lat`}>Pickup latitude</Label>
          <Input
            id={`${idPrefix}-lat`}
            type="number"
            step="any"
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-lng`}>Pickup longitude</Label>
          <Input
            id={`${idPrefix}-lng`}
            type="number"
            step="any"
            value={form.lng}
            onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })}
          />
        </div>
      </div>
      <p className="text-[11px] text-muted">
        Keri uses this palengke’s lat/lng as the pickup pin for every stall under
        it.
      </p>
      <div className="flex items-center gap-3">
        <Switch
          id={`${idPrefix}-active`}
          checked={form.isActive}
          onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
        />
        <Label htmlFor={`${idPrefix}-active`}>Active</Label>
      </div>
    </div>
  )
}

function CreateBranchDialog() {
  const addBranch = useBranchStore((s) => s.addBranch)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<BranchFormInput>(DEFAULT_FORM)

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setForm(DEFAULT_FORM)
    setOpen(isOpen)
  }

  const handleSave = () => {
    const result = addBranch(form)
    if (result.ok) {
      toast.success(`Added ${result.branch.name}`)
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
          Add palengke
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add palengke / market</DialogTitle>
          <DialogDescription>
            Register a market branch. Vendors will be assigned here; lon/lat is
            the Keri pickup point.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <BranchFormFields form={form} setForm={setForm} idPrefix="create" />
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditBranchDialog({ branch }: { branch: Branch }) {
  const updateBranch = useBranchStore((s) => s.updateBranch)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<BranchFormInput>({
    name: branch.name,
    address: branch.address,
    lat: branch.lat,
    lng: branch.lng,
    isActive: branch.isActive,
  })

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setForm({
        name: branch.name,
        address: branch.address,
        lat: branch.lat,
        lng: branch.lng,
        isActive: branch.isActive,
      })
    }
    setOpen(isOpen)
  }

  const handleSave = () => {
    const result = updateBranch(branch.id, form)
    if (result.ok) {
      toast.success('Palengke updated')
      setOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit palengke</DialogTitle>
          <DialogDescription>
            Update name, address, or Keri pickup coordinates.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <BranchFormFields form={form} setForm={setForm} idPrefix={branch.id} />
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminBranchesPage() {
  const branches = useBranchStore((s) => s.branches)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-deep">
            Palengke Branches
          </h1>
          <p className="mt-1 text-sm text-muted">
            Markets own the Keri pickup pin. Vendors belong to a palengke.
          </p>
        </div>
        <CreateBranchDialog />
      </div>

      {branches.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No palengkes yet"
          description="Add a market branch so vendors can be assigned a pickup location."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{branch.name}</CardTitle>
                    <CardDescription className="mt-1 flex items-start gap-1">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      {branch.address}
                    </CardDescription>
                  </div>
                  <Badge variant={branch.isActive ? 'success' : 'muted'}>
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-mono text-xs text-muted">
                  {branch.lat.toFixed(5)}, {branch.lng.toFixed(5)}
                </p>
                <EditBranchDialog branch={branch} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
