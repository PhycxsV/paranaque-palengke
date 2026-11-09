import { useMemo, useState, type ReactNode } from 'react'
import { Archive, Package, Pencil, Plus, Search, Tag } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterTabs, type FilterTabItem } from '@/components/shared/FilterTabs'
import { PortalHeader } from '@/components/shared/PortalHeader'
import { ProductImage } from '@/components/shared/ProductImage'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useProductStore } from '@/stores/product-store'
import { useCommodityStore } from '@/stores/commodity-store'
import {
  getCommodityRange,
  getPriceRangeMessage,
  getVendorPrice,
} from '@/lib/pricing'
import {
  LOW_STOCK_THRESHOLD,
  PRICE_DISCLAIMER,
  VENDOR_STOCK_UNITS,
} from '@/constants'
import { cn, formatPeso } from '@/lib/utils'
import type { Product, ProductFormInput, ProductUnit } from '@/types'

const EMPTY_FORM: ProductFormInput = {
  commodityId: '',
  name: '',
  description: '',
  category: 'Vegetables',
  unit: 'kg',
  vendorPrice: 0,
  stock: 0,
  imageUrl: '',
  isAvailable: true,
}

interface FormErrors {
  commodityId?: string
  description?: string
  stock?: string
  vendorPrice?: string
  unit?: string
}

function validateForm(
  form: ProductFormInput,
  commodity: { priceMin: number; priceMax: number; name: string } | undefined,
): FormErrors {
  const errors: FormErrors = {}
  if (!form.commodityId) errors.commodityId = 'Select a commodity'
  if (form.stock < 0) errors.stock = 'Stock cannot be negative'
  if (!VENDOR_STOCK_UNITS.includes(form.unit as 'kg' | 'piece')) {
    errors.unit = 'Unit must be kg or pcs'
  }
  if (commodity) {
    const rangeMsg = getPriceRangeMessage(form.vendorPrice, commodity)
    if (rangeMsg) errors.vendorPrice = rangeMsg
  } else if (!Number.isFinite(form.vendorPrice) || form.vendorPrice <= 0) {
    errors.vendorPrice = 'Enter a valid price.'
  }
  return errors
}

function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0
}

function formatUnitLabel(unit: ProductUnit): string {
  return unit === 'piece' ? 'pcs' : unit
}

function formatLguRange(
  min: number,
  max: number,
  unit: ProductUnit,
): string {
  return `${formatPeso(min)}–${formatPeso(max)}/${formatUnitLabel(unit)}`
}

type ListFilter = 'all' | 'available' | 'unavailable' | 'low'

/** Shows where the vendor's price sits inside the LGU range. */
function PriceRangeBar({
  price,
  min,
  max,
}: {
  price: number
  min: number
  max: number
}) {
  const span = max - min
  const pct = span > 0 ? Math.min(100, Math.max(0, ((price - min) / span) * 100)) : 50
  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-gradient-to-r from-lime/60 via-bay/50 to-primary/60">
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary-deep shadow"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-muted">
        <span>{formatPeso(min)}</span>
        <span>LGU range</span>
        <span>{formatPeso(max)}</span>
      </div>
    </div>
  )
}

function FormSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <fieldset className="grid gap-4 rounded-xl border border-border bg-warm-white/60 p-4">
      <legend className="-ml-1 px-1 text-[11px] font-bold uppercase tracking-wider text-primary">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

export default function VendorProductsPage() {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const products = useProductStore((s) => s.products)
  const addProduct = useProductStore((s) => s.addProduct)
  const updateProduct = useProductStore((s) => s.updateProduct)
  const toggleAvailability = useProductStore((s) => s.toggleAvailability)
  const archiveProduct = useProductStore((s) => s.archiveProduct)
  const commodities = useCommodityStore((s) => s.commodities)

  const activeCommodities = commodities.filter((c) => c.isActive)

  const vendorProducts = useMemo(
    () =>
      products.filter(
        (p) => p.vendorId === activeVendorId && !p.isArchived,
      ),
    [products, activeVendorId],
  )

  const [addOpen, setAddOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormInput>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [filter, setFilter] = useState<ListFilter>('all')
  const [query, setQuery] = useState('')

  const tabs = useMemo<FilterTabItem<ListFilter>[]>(
    () => [
      { value: 'all', label: 'All', count: vendorProducts.length },
      {
        value: 'available',
        label: 'Available',
        count: vendorProducts.filter((p) => p.isAvailable).length,
      },
      {
        value: 'unavailable',
        label: 'Unavailable',
        count: vendorProducts.filter((p) => !p.isAvailable).length,
      },
      {
        value: 'low',
        label: 'Low stock',
        count: vendorProducts.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length,
      },
    ],
    [vendorProducts],
  )

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vendorProducts.filter((p) => {
      if (filter === 'available' && !p.isAvailable) return false
      if (filter === 'unavailable' && p.isAvailable) return false
      if (filter === 'low' && p.stock > LOW_STOCK_THRESHOLD) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      )
    })
  }, [vendorProducts, filter, query])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setAddOpen(true)
  }

  const openEdit = (product: Product) => {
    setForm({
      commodityId: product.commodityId,
      name: product.name,
      description: product.description,
      category: product.category,
      unit: product.unit,
      vendorPrice: product.vendorPrice,
      stock: product.stock,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable,
    })
    setErrors({})
    setEditProduct(product)
  }

  const updateField = <K extends keyof ProductFormInput>(
    key: K,
    value: ProductFormInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const selectCommodity = (commodityId: string) => {
    const commodity = activeCommodities.find((c) => c.id === commodityId)
    if (commodity) {
      const defaultUnit = VENDOR_STOCK_UNITS.includes(
        commodity.unit as 'kg' | 'piece',
      )
        ? commodity.unit
        : 'kg'
      setForm((prev) => ({
        ...prev,
        commodityId: commodity.id,
        name: commodity.name,
        description: prev.description || commodity.description,
        category: commodity.category,
        unit: defaultUnit,
        vendorPrice:
          prev.vendorPrice > 0
            ? prev.vendorPrice
            : Number(
                ((commodity.priceMin + commodity.priceMax) / 2).toFixed(2),
              ),
        imageUrl: prev.imageUrl || commodity.imageUrl,
      }))
    }
    setErrors((prev) => ({ ...prev, commodityId: undefined, vendorPrice: undefined }))
  }

  const handleAdd = () => {
    const commodity = activeCommodities.find((c) => c.id === form.commodityId)
    const validation = validateForm(form, commodity)
    if (hasErrors(validation)) {
      setErrors(validation)
      return
    }
    addProduct(activeVendorId, {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      vendorPrice: Number(form.vendorPrice.toFixed(2)),
    })
    setAddOpen(false)
    toast.success('Product added')
  }

  const handleEdit = () => {
    if (!editProduct) return
    const commodity = activeCommodities.find((c) => c.id === form.commodityId)
    const validation = validateForm(form, commodity)
    if (hasErrors(validation)) {
      setErrors(validation)
      return
    }
    updateProduct(editProduct.id, {
      description: form.description.trim(),
      unit: form.unit,
      vendorPrice: Number(form.vendorPrice.toFixed(2)),
      stock: form.stock,
      imageUrl: form.imageUrl.trim(),
      isAvailable: form.isAvailable,
    })
    setEditProduct(null)
    toast.success('Product updated')
  }

  const handleToggle = (product: Product) => {
    toggleAvailability(product.id)
    toast.success(
      product.isAvailable
        ? `${product.name} marked unavailable`
        : `${product.name} marked available`,
    )
  }

  const handleArchive = (product: Product) => {
    archiveProduct(product.id)
    toast.success(`${product.name} archived`)
  }

  const selectedCommodity = activeCommodities.find(
    (c) => c.id === form.commodityId,
  )
  const livePriceMessage = selectedCommodity
    ? getPriceRangeMessage(form.vendorPrice, selectedCommodity)
    : null

  const isEditing = editProduct !== null

  const formFields = (
    <div className="grid gap-4">
      <FormSection title="Commodity">
        {!isEditing ? (
          <div className="grid gap-1.5">
            <Label>Commodity *</Label>
            <Select value={form.commodityId} onValueChange={selectCommodity}>
              <SelectTrigger>
                <SelectValue placeholder="Select an LGU commodity..." />
              </SelectTrigger>
              <SelectContent>
                {activeCommodities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — {formatLguRange(c.priceMin, c.priceMax, c.unit)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.commodityId ? (
              <p className="text-xs text-red-600">{errors.commodityId}</p>
            ) : null}
          </div>
        ) : null}

        {selectedCommodity ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-white p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <Tag className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-primary-deep">
                {selectedCommodity.name}
                <span className="ml-2 text-xs font-medium text-muted">
                  {selectedCommodity.category}
                </span>
              </p>
              <p className="text-xs text-muted">
                LGU range:{' '}
                <span className="font-bold text-primary">
                  {formatLguRange(
                    selectedCommodity.priceMin,
                    selectedCommodity.priceMax,
                    selectedCommodity.unit,
                  )}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">
            Pick a commodity to see its LGU price range and fill in the details.
          </p>
        )}
        {selectedCommodity ? (
          <p className="text-[11px] italic text-muted">{PRICE_DISCLAIMER}</p>
        ) : null}
      </FormSection>

      <FormSection title="Price & stock">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1.5 sm:col-span-1">
            <Label htmlFor="pf-price">Your price</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
                ₱
              </span>
              <Input
                id="pf-price"
                type="number"
                step="0.01"
                min="0.01"
                className="pl-8"
                value={form.vendorPrice || ''}
                onChange={(e) =>
                  updateField('vendorPrice', parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Unit</Label>
            <Select
              value={form.unit}
              onValueChange={(v) => updateField('unit', v as ProductUnit)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_STOCK_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {formatUnitLabel(unit)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pf-stock">Stock</Label>
            <div className="relative">
              <Input
                id="pf-stock"
                type="number"
                min={0}
                className="pr-12"
                value={form.stock || ''}
                onChange={(e) => updateField('stock', Number(e.target.value))}
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                {formatUnitLabel(form.unit)}
              </span>
            </div>
          </div>
        </div>
        {errors.unit ? <p className="text-xs text-red-600">{errors.unit}</p> : null}
        {errors.stock ? <p className="text-xs text-red-600">{errors.stock}</p> : null}
        {livePriceMessage ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            {livePriceMessage}
          </p>
        ) : selectedCommodity && form.vendorPrice > 0 ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            Within the LGU range.
          </p>
        ) : null}
        {errors.vendorPrice && !livePriceMessage ? (
          <p className="text-xs text-red-600">{errors.vendorPrice}</p>
        ) : null}
      </FormSection>

      <FormSection title="Listing">
        <div className="grid gap-1.5">
          <Label htmlFor="pf-desc">Description</Label>
          <Textarea
            id="pf-desc"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Short description shown to customers"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="pf-img">Image URL</Label>
          <div className="flex items-center gap-3">
            {form.imageUrl ? (
              <ProductImage
                src={form.imageUrl}
                alt="Preview"
                className="h-11 w-11 shrink-0 rounded-lg ring-1 ring-border"
              />
            ) : null}
            <Input
              id="pf-img"
              value={form.imageUrl}
              onChange={(e) => updateField('imageUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
        <label
          htmlFor="pf-avail"
          className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3"
        >
          <span>
            <span className="block text-sm font-bold text-primary-deep">
              Available for purchase
            </span>
            <span className="block text-xs text-muted">
              Customers can add this to their cart.
            </span>
          </span>
          <Switch
            id="pf-avail"
            checked={form.isAvailable}
            onCheckedChange={(checked) => updateField('isAvailable', checked)}
          />
        </label>
      </FormSection>
    </div>
  )

  return (
    <div className="space-y-6">
      <PortalHeader
        eyebrow="Vendor portal"
        title="Products"
        description={`${vendorProducts.length} active listing${vendorProducts.length !== 1 ? 's' : ''}. Set your price within the LGU range and keep stock up to date.`}
        actions={
          <Button onClick={openAdd} size="lg">
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        }
      />

      {vendorProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products"
          description="Add your first product to start selling."
          actionLabel="Add product"
          onAction={openAdd}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <FilterTabs items={tabs} value={filter} onChange={setFilter} />
            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your products…"
                className="pl-10"
                aria-label="Search your products"
              />
            </div>
          </div>

          {visibleProducts.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching products"
              description="Try a different filter or search term."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => {
                const vendorPrice = getVendorPrice(product, commodities)
                const range = getCommodityRange(product, commodities)
                const out = product.stock <= 0
                const low = !out && product.stock <= LOW_STOCK_THRESHOLD
                return (
                  <article
                    key={product.id}
                    className={cn(
                      'hover-lift group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]',
                      !product.isAvailable && 'bg-gray-50/60',
                    )}
                  >
                    <div className="relative">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        className={cn(
                          'h-44 w-full',
                          !product.isAvailable && 'grayscale',
                        )}
                        imgClassName="transition duration-500 group-hover:scale-105"
                      />
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-primary-deep/50 to-transparent" />
                      <span
                        className={cn(
                          'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur',
                          product.isAvailable
                            ? 'bg-white/95 text-emerald-800'
                            : 'bg-gray-900/70 text-white',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            product.isAvailable ? 'bg-emerald-500' : 'bg-gray-300',
                          )}
                        />
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      <span
                        className={cn(
                          'absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm',
                          out
                            ? 'bg-red-500 text-white'
                            : low
                              ? 'bg-gold text-primary-deep'
                              : 'bg-white/95 text-primary-deep',
                        )}
                      >
                        {out
                          ? 'Out of stock'
                          : `${product.stock} ${formatUnitLabel(product.unit)} left`}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                          {product.category}
                        </p>
                        <h3 className="mt-0.5 truncate text-lg font-extrabold text-primary-deep">
                          {product.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted">
                          {product.description}
                        </p>
                      </div>

                      <div className="rounded-xl bg-primary-50/70 p-3.5">
                        <p className="font-display text-2xl font-extrabold leading-none text-primary-deep">
                          {formatPeso(vendorPrice)}
                          <span className="ml-1 text-sm font-semibold text-muted">
                            /{formatUnitLabel(product.unit)}
                          </span>
                        </p>
                        {range ? (
                          <div className="mt-3">
                            <PriceRangeBar
                              price={vendorPrice}
                              min={range.min}
                              max={range.max}
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
                        <label className="flex flex-1 cursor-pointer items-center gap-2.5 text-xs font-semibold text-ink">
                          <Switch
                            checked={product.isAvailable}
                            onCheckedChange={() => handleToggle(product)}
                            aria-label={`Toggle availability for ${product.name}`}
                          />
                          {product.isAvailable ? 'On sale' : 'Hidden'}
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(product)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-9 px-0 text-red-600 hover:bg-red-50"
                              aria-label={`Archive ${product.name}`}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Archive "{product.name}"?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the product from your active
                                listings. Archived products cannot be restored in
                                this demo.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleArchive(product)}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Archive
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Add product dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
            <DialogDescription>
              Choose an LGU commodity, then set your own price and stock.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>{formFields}</DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAdd}>Add product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit product dialog */}
      <Dialog
        open={editProduct !== null}
        onOpenChange={(open) => {
          if (!open) setEditProduct(null)
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit {editProduct?.name ?? 'product'}</DialogTitle>
            <DialogDescription>
              Update your price, stock and availability.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>{formFields}</DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
