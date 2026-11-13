import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Store, UserRound } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/shared/EmptyState'
import { useBranchStore } from '@/stores/branch-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useVendorUserStore } from '@/stores/vendor-user-store'

export default function AdminUserDetailPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const users = useVendorUserStore((s) => s.users)
  const updateUser = useVendorUserStore((s) => s.updateUser)
  const vendors = useVendorStore((s) => s.vendors)
  const branches = useBranchStore((s) => s.branches)

  const user = users.find((u) => u.id === userId)
  const stores = vendors.filter((v) => v.ownerUserId === userId)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [changePassword, setChangePassword] = useState(false)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setPhone(user.phone)
      setPassword('')
      setChangePassword(false)
      setIsActive(user.isActive)
    }
  }, [user])

  if (!user) {
    return (
      <div className="space-y-4">
        <Link to="/admin/users">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to users
          </Button>
        </Link>
        <EmptyState
          icon={UserRound}
          title="User not found"
          description="This vendor user does not exist."
        />
      </div>
    )
  }

  const handleSave = () => {
    if (changePassword && password.trim().length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    const result = updateUser(user.id, {
      name,
      email,
      phone,
      isActive,
      ...(changePassword ? { password: password.trim() } : {}),
    })
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    setPassword('')
    setChangePassword(false)
    toast.success('User credentials saved')
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/users">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <UserRound className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <Badge variant={user.isActive ? 'success' : 'muted'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription className="mt-1">
                {user.email} · {user.phone}
              </CardDescription>
              <p className="mt-2 text-sm text-muted">
                Owns {stores.length}{' '}
                {stores.length === 1 ? 'store' : 'stores'}. Use lipatan on a
                store detail page to transfer ownership.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account credentials</CardTitle>
          <CardDescription>
            Email, phone, and password for this vendor user. Login is not wired
            yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="detail-user-name">Full name</Label>
            <Input
              id="detail-user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="detail-user-email">Email</Label>
              <Input
                id="detail-user-email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="detail-user-phone">Phone</Label>
              <Input
                id="detail-user-phone"
                type="tel"
                autoComplete="off"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={changePassword}
                onChange={(e) => {
                  setChangePassword(e.target.checked)
                  if (!e.target.checked) setPassword('')
                }}
              />
              Change password
            </label>
            {changePassword ? (
              <div className="space-y-1.5">
                <Label htmlFor="detail-user-password">New password</Label>
                <Input
                  id="detail-user-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
            ) : (
              <p className="text-xs text-muted">
                Current password is set ({user.password.length} characters).
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="detail-user-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="detail-user-active">Active account</Label>
          </div>
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="h-4 w-4" />
            Save credentials
          </Button>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-primary-deep">Stores owned</h2>
          <Link to="/admin/vendors">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Store className="h-4 w-4" />
              Manage stores
            </Button>
          </Link>
        </div>
        {stores.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No stores yet"
            description="Create a store and assign this user as owner, or transfer a store here via lipatan."
            actionLabel="Create store"
            onAction={() => navigate('/admin/vendors')}
          />
        ) : (
          <ul className="space-y-2">
            {stores.map((store) => {
              const branch = branches.find((b) => b.id === store.branchId)
              return (
                <li key={store.id}>
                  <Link
                    to={`/admin/vendors/${store.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition hover:bg-primary-50/50"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-primary-deep">
                        {store.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {branch?.name ?? 'No palengke'} · {store.location}
                      </p>
                    </div>
                    <Badge variant={store.isAvailable ? 'success' : 'muted'}>
                      {store.isAvailable ? 'Open' : 'Closed'}
                    </Badge>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
