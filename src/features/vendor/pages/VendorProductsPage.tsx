import { useMemo, useState } from 'react'
import { Archive, Package, Pencil, Plus } from 'lucide-react'
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
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { Badge } from '@/components/ui/badge'
import { ProductImage } from '@/components/shared/ProductImage'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useProductStore } from '@/stores/product-store'
import { useCommodityStore } from '@/stores/commodity-store'
import {
  getCommodityRange,
  getPriceRangeMessage,
  getVendorPrice,
} from '@/lib/pricing'
import { PRICE_DISCLAIMER, VENDOR_STOCK_UNITS } from '@/constants'
import { formatPeso } from '@/lib/utils'
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
      {/* Commodity selector — only in add mode */}
      {!isEditing && (
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
          {selectedCommodity && (
            <div className="mt-1 rounded-lg border border-primary/20 bg-primary-50/50 p-3">
              <p className="text-sm font-semibold text-primary-deep">
                {selectedCommodity.name}
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
              <p className="mt-1 text-[11px] italic text-muted">
                {PRICE_DISCLAIMER}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Read-only commodity info in edit mode */}
      {isEditing && selectedCommodity && (
        <div className="rounded-lg border border-primary/20 bg-primary-50/50 p-3">
          <p className="text-xs font-medium text-muted">Commodity</p>
          <p className="text-sm font-semibold text-primary-deep">
            {selectedCommodity.name}
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
          <p className="mt-1 text-[10px] italic text-muted">{PRICE_DISCLAIMER}</p>
        </div>
      )}

      {/* Name (read-only, derived from commodity) */}
      <div className="grid gap-1.5">
        <Label htmlFor="pf-name">Name</Label>
        <Input
          id="pf-name"
          value={form.name}
          readOnly
          className="bg-muted/20"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="pf-desc">Description (override)</Label>
        <Textarea
          id="pf-desc"
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief description override"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Category</Label>
          <Input value={form.category} readOnly className="bg-muted/20" />
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
          {errors.unit ? (
            <p className="text-xs text-red-600">{errors.unit}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="pf-price">Your price (₱)</Label>
          <Input
            id="pf-price"
            type="number"
            step="0.01"
            min="0.01"
            value={form.vendorPrice || ''}
            onChange={(e) =>
              updateField('vendorPrice', parseFloat(e.target.value) || 0)
            }
          />
          {livePriceMessage ? (
            <p className="text-xs text-amber-700">{livePriceMessage}</p>
          ) : selectedCommodity && form.vendorPrice > 0 ? (
            <p className="text-xs text-emerald-700">Within the LGU range.</p>
          ) : null}
          {errors.vendorPrice ? (
            <p className="text-xs text-red-600">{errors.vendorPrice}</p>
          ) : null}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="pf-stock">Stock</Label>
          <Input
            id="pf-stock"
            type="number"
            min={0}
            value={form.stock || ''}
            onChange={(e) => updateField('stock', Number(e.target.value))}
          />
          {errors.stock ? (
            <p className="text-xs text-red-600">{errors.stock}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="pf-img">Image URL</Label>
        <Input
          id="pf-img"
          value={form.imageUrl}
          onChange={(e) => updateField('imageUrl', e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="flex items-center gap-3">
        <Switch
          id="pf-avail"
          checked={form.isAvailable}
          onCheckedChange={(checked) => updateField('isAvailable', checked)}
        />
        <Label htmlFor="pf-avail">Available for purchase</Label>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-deep">
            Products
          </h1>
          <p className="mt-1 text-sm text-muted">
            {vendorProducts.length} active product
            {vendorProducts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </div>

      {vendorProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products"
          description="Add your first product to start selling."
          actionLabel="Add product"
          onAction={openAdd}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vendorProducts.map((product) => {
            const vendorPrice = getVendorPrice(product, commodities)
            const range = getCommodityRange(product, commodities)
            return (
              <Card key={product.id} className="flex flex-col overflow-hidden">
                <ProductImage
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-40 w-full"
                />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-primary-deep">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {product.category}
                      </p>
                    </div>
                    <Badge
                      variant={product.isAvailable ? 'success' : 'muted'}
                    >
                      {product.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted">
                    {product.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2 text-sm">
                    <div>
                      <span className="font-bold text-primary-deep">
                        {formatPeso(vendorPrice)}/
                        {formatUnitLabel(product.unit)}
                      </span>
                      {range ? (
                        <p className="text-[10px] text-muted">
                          LGU {formatPeso(range.min)}–{formatPeso(range.max)}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-muted">
                      Stock: {product.stock}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(product)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(product)}
                    >
                      {product.isAvailable ? 'Mark unavailable' : 'Mark available'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Archive className="h-3.5 w-3.5" />
                          Archive
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Archive "{product.name}"?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the product from your active listings.
                            Archived products cannot be restored in this demo.
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
              </Card>
            )
          })}
        </div>
      )}

      {/* Add product dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
          </DialogHeader>
          {formFields}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
          </DialogHeader>
          {formFields}
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
