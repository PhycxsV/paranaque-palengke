import { useState } from 'react'
import { toast } from 'sonner'
import { Edit, Wheat } from 'lucide-react'
import { PRICE_DISCLAIMER } from '@/constants'
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
import { Badge } from '@/components/ui/badge'
import { useCommodityStore } from '@/stores/commodity-store'
import { formatPeso, formatDateTime } from '@/lib/utils'
import type { Commodity } from '@/types'

function EditPriceDialog({ commodity }: { commodity: Commodity }) {
  const updateStandardPrice = useCommodityStore((s) => s.updateStandardPrice)
  const [open, setOpen] = useState(false)
  const [price, setPrice] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [note, setNote] = useState('')

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setPrice(String(commodity.standardPrice))
      setEffectiveFrom(new Date().toISOString().slice(0, 10))
      setNote('')
    }
    setOpen(isOpen)
  }

  const handleSave = () => {
    const parsed = parseFloat(price)
    const result = updateStandardPrice({
      commodityId: commodity.id,
      standardPrice: parsed,
      effectiveFrom: new Date(effectiveFrom).toISOString(),
      note: note.trim() || undefined,
    })
    if (result.ok) {
      toast.success(`Updated ${commodity.name} to ${formatPeso(parsed)}`)
      setOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Edit className="h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Standard Price</DialogTitle>
          <DialogDescription>
            Set a new LGU standard price for {commodity.name} (/{commodity.unit}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="price">New Price (₱)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="effective">Effective Date</Label>
            <Input
              id="effective"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              placeholder="Reason for price change…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save Price</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminCommoditiesPage() {
  const commodities = useCommodityStore((s) => s.commodities)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-deep">
          Commodities
        </h1>
        <p className="mt-1 text-sm text-muted">{PRICE_DISCLAIMER}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-warm-white text-left">
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                Commodity
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                Category
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                Unit
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary-deep">
                Standard Price
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                Effective From
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {commodities.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border last:border-0 hover:bg-warm-white/50"
              >
                <td className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                    <Wheat className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted line-clamp-1">
                      {c.description}
                    </p>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant="secondary">{c.category}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  per {c.unit}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-primary-deep">
                  {formatPeso(c.standardPrice)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                  {formatDateTime(c.effectiveFrom)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={c.isActive ? 'success' : 'muted'}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <EditPriceDialog commodity={c} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {commodities.map((c) => (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <CardDescription>{c.category}</CardDescription>
                </div>
                <Badge variant={c.isActive ? 'success' : 'muted'}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-primary-deep">
                  {formatPeso(c.standardPrice)}
                </p>
                <p className="text-xs text-muted">per {c.unit}</p>
              </div>
              <EditPriceDialog commodity={c} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
