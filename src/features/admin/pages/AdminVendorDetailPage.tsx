import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRightLeft, MapPin, Package, Save, Store, User } from 'lucide-react'
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
import { EmptyState } from '@/components/shared/EmptyState'
import { useBranchStore } from '@/stores/branch-store'
import { useCommodityStore } from '@/stores/commodity-store'
import { useOfferStore } from '@/stores/offer-store'
import { useOrderStore } from '@/stores/order-store'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useVendorUserStore } from '@/stores/vendor-user-store'
import { formatPeso } from '@/lib/utils'

export default function AdminVendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>()
  const vendors = useVendorStore((s) => s.vendors)
  const updateVendor = useVendorStore((s) => s.updateVendor)
  const users = useVendorUserStore((s) => s.users)
  const branches = useBranchStore((s) => s.branches)
  const products = useProductStore((s) => s.products)
  const commodities = useCommodityStore((s) => s.commodities)
  const offers = useOfferStore((s) => s.offers)
  const orders = useOrderStore((s) => s.orders)

  const vendor = vendors.find((v) => v.id === vendorId)
  const branch = branches.find((b) => b.id === vendor?.branchId)
  const owner = users.find((u) => u.id === vendor?.ownerUserId)

  const [rating, setRating] = useState(4.5)
  const [branchId, setBranchId] = useState('')
  const [ownerUserId, setOwnerUserId] = useState('')

  useEffect(() => {
    if (vendor) {
      setRating(vendor.rating)
      setBranchId(vendor.branchId)
      setOwnerUserId(vendor.ownerUserId)
    }
  }, [vendor])

  if (!vendor) {
    return (
      <div className="space-y-4">
        <Link to="/admin/vendors">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to stores
          </Button>
        </Link>
        <EmptyState
          icon={Store}
          title="Store not found"
          description="This store does not exist in the demo data."
        />
      </div>
    )
  }

  const vendorProducts = products.filter(
    (p) => p.vendorId === vendor.id && !p.isArchived,
  )
  const vendorOfferCount = offers.filter(
    (o) => o.vendorId === vendor.id,
  ).length
  const vendorOrderCount = orders.filter(
    (o) => o.vendorId === vendor.id,
  ).length

  const getCommodityRange = (commodityId: string) => {
    const commodity = commodities.find((c) => c.id === commodityId)
    if (!commodity) return null
    return { min: commodity.priceMin, max: commodity.priceMax }
  }

  const handleSaveAssignment = () => {
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      toast.error('Rating must be between 1 and 5.')
      return
    }
    if (!branchId) {
      toast.error('Select a palengke / market.')
      return
    }
    const result = updateVendor(vendor.id, {
      name: vendor.name,
      description: vendor.description,
      location: vendor.location,
      isAvailable: vendor.isAvailable,
      opensAt: vendor.opensAt,
      cutoffTime: vendor.cutoffTime,
      rating,
      branchId,
    })
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success('Store rating and palengke assignment saved')
  }

  const handleLipatan = () => {
    if (!ownerUserId) {
      toast.error('Select a vendor user.')
      return
    }
    if (ownerUserId === vendor.ownerUserId) {
      toast.info('This user already owns the store.')
      return
    }
    const result = updateVendor(vendor.id, {
      name: vendor.name,
      description: vendor.description,
      location: vendor.location,
      isAvailable: vendor.isAvailable,
      opensAt: vendor.opensAt,
      cutoffTime: vendor.cutoffTime,
      ownerUserId,
    })
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    const next = users.find((u) => u.id === ownerUserId)
    toast.success(
      next
        ? `Store transferred to ${next.name}`
        : 'Store ownership updated',
    )
  }

  const selectedBranch = branches.find((b) => b.id === branchId) ?? branch

  return (
    <div className="space-y-6">
      <Link to="/admin/vendors">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to stores
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <Store className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl">{vendor.name}</CardTitle>
                <Badge variant={vendor.isAvailable ? 'success' : 'muted'}>
                  {vendor.isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
                <Badge variant="secondary">★ {vendor.rating.toFixed(1)}</Badge>
              </div>
              <CardDescription className="mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {branch?.name ?? 'No palengke'} · {vendor.location}
              </CardDescription>
              <p className="mt-2 text-sm text-muted">{vendor.description}</p>
              {owner ? (
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
                  <User className="h-3.5 w-3.5 text-muted" />
                  <span className="text-muted">Owned by</span>
                  <Link
                    to={`/admin/users/${owner.id}`}
                    className="font-semibold text-primary underline"
                  >
                    {owner.name}
                  </Link>
                  <span className="text-muted">· {owner.email}</span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-amber-700">No owner assigned</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {vendor.categories.map((cat) => (
              <Badge key={cat} variant="secondary">
                {cat}
              </Badge>
            ))}
          </div>
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="font-bold text-primary-deep">
                {vendorProducts.length}
              </span>{' '}
              <span className="text-muted">Products</span>
            </div>
            <div>
              <span className="font-bold text-primary-deep">
                {vendorOfferCount}
              </span>{' '}
              <span className="text-muted">Offers</span>
            </div>
            <div>
              <span className="font-bold text-primary-deep">
                {vendorOrderCount}
              </span>{' '}
              <span className="text-muted">Orders</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Lipatan / transfer ownership
          </CardTitle>
          <CardDescription>
            Give this store to a different vendor user. Credentials stay on the
            user accounts — only the store link changes. One user can own many
            stores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lipatan-owner">New owner</Label>
            <select
              id="lipatan-owner"
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={ownerUserId}
              onChange={(e) => setOwnerUserId(e.target.value)}
            >
              <option value="">Select vendor user…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.email}
                  {!u.isActive ? ' (inactive)' : ''}
                  {u.id === vendor.ownerUserId ? ' — current' : ''}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleLipatan} className="gap-1.5">
            <ArrowRightLeft className="h-4 w-4" />
            Transfer store
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Palengke assignment</CardTitle>
          <CardDescription>
            Stall belongs to a market. Keri pickup lon/lat comes from that
            palengke — not from the vendor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-branch">Palengke / market</Label>
              <select
                id="admin-branch"
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
              >
                <option value="">Select palengke…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {!b.isActive ? ' (inactive)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-rating">Rating (1–5)</Label>
              <Input
                id="admin-rating"
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              />
            </div>
          </div>
          {selectedBranch ? (
            <p className="text-sm text-muted">
              Pickup pin:{' '}
              <span className="font-mono text-ink">
                {selectedBranch.lat.toFixed(5)}, {selectedBranch.lng.toFixed(5)}
              </span>{' '}
              · {selectedBranch.address}
            </p>
          ) : null}
          <Button onClick={handleSaveAssignment} className="gap-1.5">
            <Save className="h-4 w-4" />
            Save assignment
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-bold text-primary-deep">Products</h2>
        {vendorProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products"
            description="This store has no active products."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-warm-white text-left">
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                    Product
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                    Category
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary-deep">
                    Vendor Price
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary-deep">
                    LGU Range
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary-deep">
                    Stock
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {vendorProducts.map((p) => {
                  const range = getCommodityRange(p.commodityId)
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 hover:bg-warm-white/50"
                    >
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant="secondary">{p.category}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-primary-deep">
                        {formatPeso(p.vendorPrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-muted">
                        {range
                          ? `${formatPeso(range.min)}–${formatPeso(range.max)}`
                          : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {p.stock}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge
                          variant={p.isAvailable ? 'success' : 'muted'}
                        >
                          {p.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
