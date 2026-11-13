import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, Store, UserRound } from 'lucide-react'
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
import { useVendorStore } from '@/stores/vendor-store'
import { useVendorUserStore } from '@/stores/vendor-user-store'
import type { VendorUserCreateInput } from '@/types'

const DEFAULT_USER_FORM: VendorUserCreateInput = {
  name: '',
  email: '',
  phone: '',
  password: '',
  isActive: true,
}

function CreateUserDialog() {
  const addUser = useVendorUserStore((s) => s.addUser)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<VendorUserCreateInput>(DEFAULT_USER_FORM)

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setForm({ ...DEFAULT_USER_FORM })
    setOpen(isOpen)
  }

  const handleSave = () => {
    const result = addUser(form)
    if (result.ok) {
      toast.success(`Created user ${result.user.name}`)
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
          Create user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create vendor user</DialogTitle>
          <DialogDescription>
            Account with email, phone, and password. Assign stores afterward —
            one user can own multiple stores.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Full name</Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Aling Nena"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="vendor@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-phone">Phone</Label>
              <Input
                id="user-phone"
                type="tel"
                autoComplete="off"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="09XXXXXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="At least 6 characters"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="user-active"
                checked={form.isActive ?? true}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isActive: checked }))
                }
              />
              <Label htmlFor="user-active">Active account</Label>
            </div>
            <p className="text-[11px] text-muted">
              Login UI comes later. Password is stored as plain text in
              localStorage for the demo only.
            </p>
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Create user</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminUsersPage() {
  const users = useVendorUserStore((s) => s.users)
  const vendors = useVendorStore((s) => s.vendors)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-deep">
            Vendor users
          </h1>
          <p className="mt-1 text-sm text-muted">
            Accounts and credentials. Create users here, then assign{' '}
            <Link
              to="/admin/vendors"
              className="font-medium text-primary underline"
            >
              stores
            </Link>
            .
          </p>
        </div>
        <CreateUserDialog />
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="No vendor users"
          description="Create a user, then create or transfer stores to them."
        />
      ) : (
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => {
            const storeCount = vendors.filter(
              (v) => v.ownerUserId === user.id,
            ).length
            return (
              <Link
                key={user.id}
                to={`/admin/users/${user.id}`}
                className="h-full"
              >
                <Card className="group flex h-full flex-col transition hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base">
                            {user.name}
                          </CardTitle>
                          <CardDescription className="truncate">
                            {user.email}
                          </CardDescription>
                          <p className="mt-0.5 text-xs text-muted">
                            {user.phone}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto flex flex-wrap gap-1.5">
                    <Badge variant={user.isActive ? 'success' : 'muted'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Store className="h-3 w-3" />
                      {storeCount} {storeCount === 1 ? 'store' : 'stores'}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
