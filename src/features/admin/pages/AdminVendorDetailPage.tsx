import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Package, Save, Store } from 'lucide-react'
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
import { useCommodityStore } from '@/stores/commodity-store'
import { useOfferStore } from '@/stores/offer-store'
import { useOrderStore } from '@/stores/order-store'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { formatPeso } from '@/lib/utils'

export default function AdminVendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>()
  const vendors = useVendorStore((s) => s.vendors)
  const updateVendor = useVendorStore((s) => s.updateVendor)
  const products = useProductStore((s) => s.products)
  const commodities = useCommodityStore((s) => s.commodities)
  const offers = useOfferStore((s) => s.offers)
  const orders = useOrderStore((s) => s.orders)

  const vendor = vendors.find((v) => v.id === vendorId)

  const [rating, setRating] = useState(4.5)
  const [lat, setLat] = useState(14.4793)
  const [lng, setLng] = useState(121.0198)

  useEffect(() => {
    if (vendor) {
      setRating(vendor.rating)
      setLat(vendor.lat)
      setLng(vendor.lng)
    }
  }, [vendor])

  if (!vendor) {
    return (
      <div className="space-y-4">
        <Link to="/admin/vendors">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to vendors
          </Button>
        </Link>
        <EmptyState
          icon={Store}
          title="Vendor not found"
          description="This vendor does not exist in the demo data."
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

  const handleSavePickup = () => {
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      toast.error('Rating must be between 1 and 5.')
      return
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      toast.error('Latitude must be between -90 and 90.')
      return
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      toast.error('Longitude must be between -180 and 180.')
      return
    }
    updateVendor(vendor.id, {
      name: vendor.name,
      description: vendor.description,
      location: vendor.location,
      isAvailable: vendor.isAvailable,
      opensAt: vendor.opensAt,
      cutoffTime: vendor.cutoffTime,
      rating,
      lat,
      lng,
    })
    toast.success('Store rating and Keri pickup pin saved')
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/vendors">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to vendors
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
                {vendor.location}
              </CardDescription>
              <p className="mt-2 text-sm text-muted">{vendor.description}</p>
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
          <CardTitle className="text-lg">Keri pickup pin</CardTitle>
          <CardDescription>
            Admin sets this store’s lat/lng. When a customer orders here, these
            coordinates are what Keri receives for pickup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
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
            <div className="space-y-1.5">
              <Label htmlFor="admin-lat">Latitude</Label>
              <Input
                id="admin-lat"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-lng">Longitude</Label>
              <Input
                id="admin-lng"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
              />
            </div>
          </div>
          <Button onClick={handleSavePickup} className="gap-1.5">
            <Save className="h-4 w-4" />
            Save pickup pin
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-bold text-primary-deep">Products</h2>
        {vendorProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products"
            description="This vendor has no active products."
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
