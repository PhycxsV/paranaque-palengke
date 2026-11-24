import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Store, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckoutSteps } from '@/components/shared/CheckoutSteps'
import { MapPinPicker, DEFAULT_DROPOFF_PIN } from '@/components/shared/MapPinPicker'
import { PaymentQrCard } from '@/components/shared/PaymentQrCard'
import { Notice } from '@/components/shared/Notice'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductImage } from '@/components/shared/ProductImage'
import { SectionCard } from '@/components/shared/SectionCard'
import { useCartStore } from '@/stores/cart-store'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useOrderStore } from '@/stores/order-store'
import { useCommodityStore } from '@/stores/commodity-store'
import {
  persistCustomerProfile,
  profileToCheckoutForm,
  useCustomerProfileStore,
} from '@/stores/customer-profile-store'
import { useOfferStore } from '@/stores/offer-store'
import {
  DELIVERY_FEE,
  DELIVERY_FEE_ERROR_NOTE,
  DELIVERY_FEE_LOADING_NOTE,
  DELIVERY_FEE_NOTE,
  MAX_BOOKING_WEIGHT_KG,
  MAX_BOOKING_WEIGHT_MESSAGE,
} from '@/constants'
import { isApiConfigured, quoteDeliveryFee } from '@/lib/api'
import {
  formatCoordinate,
  mapPinFromText,
  parseDropoffCoordinates,
} from '@/lib/coordinates'
import {
  resolveCartUnitPrice,
  calculateCartTotalWithPricing,
  calculateCartWeightKg,
  groupCartItemsByVendor,
} from '@/lib/pricing'
import { formatPeso } from '@/lib/utils'
import type { CheckoutFormInput } from '@/types'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, clearCart } = useCartStore()
  const products = useProductStore((s) => s.products)
  const vendors = useVendorStore((s) => s.vendors)
  const createCheckoutOrders = useOrderStore((s) => s.createCheckoutOrders)
  const commodities = useCommodityStore((s) => s.commodities)
  const allOffers = useOfferStore((s) => s.offers)
  const profile = useCustomerProfileStore((s) => s.profile)
  const saveFromCheckout = useCustomerProfileStore((s) => s.saveFromCheckout)

  const [form, setForm] = useState<CheckoutFormInput>(() =>
    profileToCheckoutForm(profile),
  )
  const [latText, setLatText] = useState(() => formatCoordinate(profile.dropoffLat))
  const [lngText, setLngText] = useState(() => formatCoordinate(profile.dropoffLng))
  const [submitting, setSubmitting] = useState(false)
  // what they picked in Find place on this page. null = nothing picked yet,
  // so we keep showing (and saving) the place from their profile
  const [pickedPlace, setPickedPlace] = useState<string | null>(null)
  const [quotedFee, setQuotedFee] = useState<number | null>(null)
  // distance + branch that the quote was based on, shown so the fee isn't a black box
  const [quotedDistance, setQuotedDistance] = useState<{
    km: number
    branchName: string
  } | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const apiMode = isApiConfigured()

  // The profile may finish loading from the API after this page mounts; fill
  // only the fields the customer has not typed into yet.
  useEffect(() => {
    setForm((f) => ({
      ...f,
      customerName: f.customerName || profile.name,
      contactNumber: f.contactNumber || profile.contactNumber,
      deliveryAddress: f.deliveryAddress || profile.deliveryAddress,
      dropoffLandmark: f.dropoffLandmark || profile.dropoffLandmark,
      notes: f.notes || profile.notes,
    }))
    setLatText((v) => v || formatCoordinate(profile.dropoffLat))
    setLngText((v) => v || formatCoordinate(profile.dropoffLng))
  }, [profile])

  const groups = useMemo(
    () => groupCartItemsByVendor(items, products),
    [items, products],
  )
  const vendorCount = groups.size || 1
  const productIds = useMemo(
    () => [...new Set(items.map((item) => item.productId))],
    [items],
  )
  const dropoffCoords = useMemo(() => {
    const parsed = parseDropoffCoordinates(latText, lngText)
    if (!parsed.ok || parsed.lat == null || parsed.lng == null) return null
    return { lat: parsed.lat, lng: parsed.lng }
  }, [latText, lngText])

  useEffect(() => {
    if (!apiMode) {
      setQuotedFee(DELIVERY_FEE)
      setQuotedDistance(null)
      setQuoteLoading(false)
      setQuoteError(null)
      return
    }
    if (!dropoffCoords || productIds.length === 0) {
      setQuotedFee(null)
      setQuotedDistance(null)
      setQuoteLoading(false)
      setQuoteError(null)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      setQuoteLoading(true)
      setQuoteError(null)
      void quoteDeliveryFee({
        dropoffLat: dropoffCoords.lat,
        dropoffLng: dropoffCoords.lng,
        productIds,
      })
        .then((quote) => {
          if (cancelled) return
          setQuotedFee(quote.deliveryCost)
          setQuotedDistance({ km: quote.distanceKm, branchName: quote.branchName })
          setQuoteError(null)
        })
        .catch((error) => {
          if (cancelled) return
          setQuotedFee(null)
          setQuotedDistance(null)
          setQuoteError(
            error instanceof Error ? error.message : DELIVERY_FEE_ERROR_NOTE,
          )
        })
        .finally(() => {
          if (!cancelled) setQuoteLoading(false)
        })
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [apiMode, dropoffCoords, productIds])

  const deliveryFee = quotedFee ?? DELIVERY_FEE
  const deliveryShare = Number((deliveryFee / vendorCount).toFixed(2))
  const subtotal = calculateCartTotalWithPricing(
    items,
    products,
    commodities,
    allOffers,
  )
  const total = subtotal + (quotedFee ?? (apiMode ? 0 : DELIVERY_FEE))
  const totalWeightKg = useMemo(
    () => calculateCartWeightKg(items, products),
    [items, products],
  )
  const overWeightLimit = totalWeightKg > MAX_BOOKING_WEIGHT_KG
  const quoteReady = !apiMode || (quotedFee != null && !quoteLoading && !quoteError)

  useEffect(() => {
    if (items.length === 0 && !submitting) {
      navigate('/customer/cart', { replace: true })
    }
  }, [items.length, navigate, submitting])

  if (items.length === 0 && !submitting) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (overWeightLimit) {
      toast.error(MAX_BOOKING_WEIGHT_MESSAGE)
      return
    }

    if (apiMode && !quoteReady) {
      toast.error(quoteError ?? DELIVERY_FEE_ERROR_NOTE)
      return
    }

    if (!form.customerName.trim()) {
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

    const coordinates = parseDropoffCoordinates(latText, lngText)
    if (!coordinates.ok) {
      toast.error(coordinates.message)
      return
    }
    if (apiMode) {
      if (!form.dropoffLandmark.trim()) {
        toast.error('Please enter a drop-off landmark.')
        return
      }
      if (coordinates.lat === null || coordinates.lng === null) {
        toast.error('Please enter your drop-off latitude and longitude.')
        return
      }
    }

    const customer: CheckoutFormInput = {
      ...form,
      dropoffLat: coordinates.lat,
      dropoffLng: coordinates.lng,
      dropoffLandmark: form.dropoffLandmark.trim(),
    }

    setSubmitting(true)

    const result = await createCheckoutOrders({
      items,
      products,
      commodities,
      offers: allOffers,
      vendors,
      customer,
    })

    if (!result.ok) {
      toast.error(result.message)
      setSubmitting(false)
      return
    }

    saveFromCheckout(customer)
    if (apiMode) {
      try {
        await persistCustomerProfile({
          deliveryAddress: customer.deliveryAddress,
          dropoffLat: customer.dropoffLat,
          dropoffLng: customer.dropoffLng,
          dropoffLandmark: customer.dropoffLandmark,
          dropoffPlace:
            pickedPlace ?? useCustomerProfileStore.getState().profile.dropoffPlace,
          notes: customer.notes ?? '',
        })
      } catch {
        // The order is placed; the profile stays cached on this device.
        toast.warning('Order placed, but your profile could not be saved to the server.')
      }
    }
    clearCart()
    toast.success(
      result.orders.length > 1
        ? `Order placed across ${result.orders.length} vendors — complete each QR payment.`
        : 'Order placed! Complete your payment.',
    )
    navigate(`/customer/payment/group/${result.bookingGroupId}`)
  }

  return (
    <>
      <PageHeader
        width="medium"
        eyebrow="Almost there"
        title="Checkout"
        back={{ to: '/customer/cart', label: 'Back to cart' }}
        description={`${vendorCount} vendor${vendorCount === 1 ? '' : 's'} · one QRPH code each`}
      >
        <CheckoutSteps current={1} />
      </PageHeader>

      <form
        onSubmit={handleSubmit}
        className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px]"
      >
        <div className="space-y-6">
          <SectionCard
            title="Your information"
            icon={UserRound}
            action={
              <Link
                to="/customer/profile"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Edit profile
              </Link>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerName: e.target.value }))
                  }
                  placeholder="Juan dela Cruz"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input
                  id="contactNumber"
                  value={form.contactNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactNumber: e.target.value }))
                  }
                  placeholder="09XX XXX XXXX"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="deliveryAddress">Drop-off address *</Label>
                <Textarea
                  id="deliveryAddress"
                  value={form.deliveryAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deliveryAddress: e.target.value }))
                  }
                  placeholder="House/unit no., street, barangay, landmark…"
                  rows={3}
                  required
                />
                <p className="text-xs text-muted">
                  Where Keri should deliver your order.
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="dropoffLandmark">
                  Landmark{apiMode ? ' *' : ''}
                </Label>
                <Input
                  id="dropoffLandmark"
                  value={form.dropoffLandmark}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dropoffLandmark: e.target.value }))
                  }
                  placeholder="e.g. Beside the blue gate, near the chapel"
                  required={apiMode}
                />
              </div>
              <MapPinPicker
                {...mapPinFromText(latText, lngText, DEFAULT_DROPOFF_PIN)}
                initialSearch={pickedPlace ?? profile.dropoffPlace}
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
                  setPickedPlace(address)
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="dropoffLat">
                    Latitude{apiMode ? ' *' : ''}
                  </Label>
                  <Input
                    id="dropoffLat"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={-90}
                    max={90}
                    value={latText}
                    onChange={(e) => setLatText(e.target.value)}
                    placeholder="14.4793"
                    required={apiMode}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dropoffLng">
                    Longitude{apiMode ? ' *' : ''}
                  </Label>
                  <Input
                    id="dropoffLng"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={-180}
                    max={180}
                    value={lngText}
                    onChange={(e) => setLngText(e.target.value)}
                    placeholder="121.0198"
                    required={apiMode}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Special instructions..."
                  rows={3}
                />
              </div>
            </div>
          </SectionCard>

          <div className="space-y-5">
            <h2 className="font-display text-xl font-extrabold text-primary-deep">
              Order by vendor
            </h2>
            {[...groups.entries()].map(([vendorId, vendorItems], index) => {
              const vendor = vendors.find((v) => v.id === vendorId)
              const vendorSubtotal = calculateCartTotalWithPricing(
                vendorItems,
                products,
                commodities,
                allOffers,
              )
              const fee =
                deliveryShare +
                (index === 0
                  ? Number(
                      (deliveryFee - deliveryShare * vendorCount).toFixed(2),
                    )
                  : 0)
              const vendorTotal = vendorSubtotal + fee

              return (
                <SectionCard
                  key={vendorId}
                  title={vendor?.name ?? 'Vendor'}
                  icon={Store}
                >
                  <div className="divide-y divide-border">
                    {vendorItems.map((item) => {
                      const product = products.find((p) => p.id === item.productId)
                      if (!product) return null
                      const offer = item.acceptedOfferId
                        ? allOffers.find((o) => o.id === item.acceptedOfferId)
                        : undefined
                      const pricing = resolveCartUnitPrice({
                        product,
                        quantity: item.quantity,
                        commodities,
                        offer,
                      })
                      return (
                        <div
                          key={item.productId}
                          className="flex items-center gap-3 py-3 first:pt-0"
                        >
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-14 w-14 shrink-0 rounded-xl"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-primary-deep">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted">
                              {item.quantity} × {formatPeso(pricing.unitPrice)}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-primary-deep">
                            {formatPeso(pricing.unitPrice * item.quantity)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-2 space-y-1.5 rounded-xl bg-primary-50/60 p-4 text-sm">
                    <div className="flex justify-between text-ink/80">
                      <span>Subtotal</span>
                      <span>{formatPeso(vendorSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-ink/80">
                      <span>Delivery share</span>
                      <span>{formatPeso(fee)}</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-primary/20 pt-2 font-bold text-primary-deep">
                      <span>Vendor total (QR amount)</span>
                      <span>{formatPeso(vendorTotal)}</span>
                    </div>
                  </div>
                  <div className="mt-5">
                    <PaymentQrCard
                      label={vendor?.qrLabel ?? 'QR Payment'}
                      amountLabel={formatPeso(vendorTotal)}
                      imageUrl={vendor?.paymentQrUrl}
                    />
                  </div>
                </SectionCard>
              )
            })}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
            <h2 className="border-b border-border bg-gradient-to-r from-primary-50/70 to-transparent px-5 py-3.5 font-bold text-primary-deep">
              Payment summary
            </h2>
            <div className="space-y-3 p-5">
              <div className="flex justify-between text-sm text-ink/80">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPeso(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink/80">
                <span>Delivery</span>
                <span className="font-semibold">
                  {quoteLoading
                    ? '…'
                    : quotedFee != null
                      ? formatPeso(quotedFee)
                      : apiMode
                        ? '—'
                        : formatPeso(DELIVERY_FEE)}
                </span>
              </div>
              {apiMode ? (
                <div className="flex justify-between gap-3 text-sm text-ink/80">
                  <span>
                    Distance
                    {quotedDistance?.branchName
                      ? ` from ${quotedDistance.branchName}`
                      : ''}
                  </span>
                  <span className="shrink-0 font-semibold">
                    {quoteLoading
                      ? '…'
                      : quotedDistance
                        ? `${quotedDistance.km.toFixed(2)} km`
                        : '—'}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm text-ink/80">
                <span>Total weight</span>
                <span className="font-semibold">
                  {totalWeightKg.toFixed(3)} kg / {MAX_BOOKING_WEIGHT_KG} kg
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-border pt-4">
                <span className="font-bold text-primary-deep">Grand total</span>
                <span className="font-display text-2xl font-extrabold text-primary">
                  {quoteLoading || (apiMode && quotedFee == null)
                    ? '…'
                    : formatPeso(total)}
                </span>
              </div>
              {overWeightLimit ? (
                <Notice tone="warning" title="Weight limit exceeded">
                  {MAX_BOOKING_WEIGHT_MESSAGE}
                </Notice>
              ) : null}
              {quoteError ? (
                <Notice tone="warning" title="Delivery fee">
                  {quoteError}
                </Notice>
              ) : (
                <p className="text-xs text-muted">
                  {quoteLoading ? DELIVERY_FEE_LOADING_NOTE : DELIVERY_FEE_NOTE}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting || overWeightLimit || !quoteReady}
              >
                {submitting ? 'Placing order...' : 'Place Order & Pay'}
              </Button>
            </div>
          </div>
          <Notice tone="info" title="QRPH only — one code per vendor">
            Pay each vendor separately after placing the order. All vendor orders
            share one booking group for Keri. Confirmation and delivery wait until
            the whole group is ready.
          </Notice>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <CreditCard className="h-3.5 w-3.5" />
            Pay by QR — the vendor confirms your payment.
          </p>
        </aside>
      </form>
    </>
  )
}
