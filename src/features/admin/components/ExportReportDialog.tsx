import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarRange,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ORDER_STATUS_LABELS } from '@/constants'
import { filterOrders, type StatusFilter } from '@/lib/order-filters'
import {
  computeTotals,
  endOfDay,
  parseLocalInput,
  startOfDay,
  toLocalInputValue,
} from '@/lib/report'
import type { ExportFormat } from '@/lib/report-export'
import { cn, formatPeso } from '@/lib/utils'
import { useBranchStore } from '@/stores/branch-store'
import { useFeedbackStore } from '@/stores/feedback-store'
import { useVendorStore } from '@/stores/vendor-store'
import type { Order } from '@/types'

export interface ExportDefaults {
  status: StatusFilter
  vendorId: string
  branchId: string
}

interface ExportReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orders: Order[]
  defaults: ExportDefaults
}

const QUICK_RANGES: { label: string; daysBack: number; days: number }[] = [
  { label: 'Today', daysBack: 0, days: 1 },
  { label: 'Yesterday', daysBack: 1, days: 1 },
  { label: 'Last 7 days', daysBack: 6, days: 7 },
  { label: 'Last 30 days', daysBack: 29, days: 30 },
]

function rangeFor(daysBack: number, days: number) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack)
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + days - 1)
  return {
    from: toLocalInputValue(startOfDay(start)),
    to: toLocalInputValue(endOfDay(end)),
  }
}

const FORMATS: {
  value: ExportFormat
  title: string
  hint: string
  icon: typeof FileText
}[] = [
  {
    value: 'xlsx',
    title: 'Excel (.xlsx)',
    hint: 'Summary, orders, line items and feedback on separate sheets.',
    icon: FileSpreadsheet,
  },
  {
    value: 'csv',
    title: 'CSV (.csv)',
    hint: 'One flat orders table — opens anywhere.',
    icon: FileText,
  },
]

export function ExportReportDialog({
  open,
  onOpenChange,
  orders,
  defaults,
}: ExportReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileSheet className="max-w-xl">
        {/* Mounted only while open so the form starts fresh with the page's filters. */}
        <ExportForm
          orders={orders}
          defaults={defaults}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function ExportForm({
  orders,
  defaults,
  onClose,
}: {
  orders: Order[]
  defaults: ExportDefaults
  onClose: () => void
}) {
  const vendors = useVendorStore((s) => s.vendors)
  const branches = useBranchStore((s) => s.branches)
  const feedback = useFeedbackStore((s) => s.feedback)

  const today = useMemo(() => rangeFor(0, 1), [])
  const [from, setFrom] = useState(today.from)
  const [to, setTo] = useState(today.to)
  const [vendorId, setVendorId] = useState(defaults.vendorId)
  const [branchId, setBranchId] = useState(defaults.branchId)
  const [status, setStatus] = useState<StatusFilter>(defaults.status)
  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const [busy, setBusy] = useState(false)

  const fromDate = parseLocalInput(from)
  const toDate = parseLocalInput(to)
  const rangeError =
    !fromDate || !toDate
      ? 'Set both a start and an end date and time.'
      : fromDate.getTime() > toDate.getTime()
        ? 'The start must be before the end.'
        : null

  const scoped = useMemo(() => {
    const start = parseLocalInput(from)
    const end = parseLocalInput(to)
    if (!start || !end || start.getTime() > end.getTime()) return []
    return filterOrders(orders, {
      status,
      vendorId,
      branchId,
      from: start,
      to: end,
    })
  }, [orders, status, vendorId, branchId, from, to])
  const totals = useMemo(() => computeTotals(scoped), [scoped])

  const activeQuick = QUICK_RANGES.find((q) => {
    const r = rangeFor(q.daysBack, q.days)
    return r.from === from && r.to === to
  })

  const visibleVendors =
    branchId === 'all' ? vendors : vendors.filter((v) => v.branchId === branchId)

  function describeFilters() {
    const parts: string[] = []
    if (vendorId !== 'all') {
      parts.push(`Vendor: ${vendors.find((v) => v.id === vendorId)?.name ?? vendorId}`)
    }
    if (branchId !== 'all') {
      parts.push(`Palengke: ${branches.find((b) => b.id === branchId)?.name ?? branchId}`)
    }
    if (status !== 'all') parts.push(`Status: ${ORDER_STATUS_LABELS[status]}`)
    return parts.length ? parts.join(' · ') : 'None (all vendors, palengkes and statuses)'
  }

  async function handleExport() {
    if (rangeError || !fromDate || !toDate) return
    setBusy(true)
    try {
      // Loaded on demand so the zip library stays out of the main bundle.
      const { exportEndOfDayReport } = await import('@/lib/report-export')
      const inScopeVendors =
        vendorId !== 'all'
          ? vendors.filter((v) => v.id === vendorId)
          : branchId !== 'all'
            ? vendors.filter((v) => v.branchId === branchId)
            : vendors
      const result = exportEndOfDayReport(format, {
        orders: scoped,
        vendors: inScopeVendors,
        feedback: feedback.filter((f) =>
          inScopeVendors.some((v) => v.id === f.vendorId),
        ),
        from: fromDate,
        to: toDate,
        generatedAt: new Date(),
        filtersLabel: describeFilters(),
      })
      toast.success(`Report downloaded`, {
        description: `${result.fileName} · ${result.orders} order${result.orders === 1 ? '' : 's'}`,
      })
      onClose()
    } catch {
      toast.error('Could not create the report. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary">
            <Download className="h-4.5 w-4.5" />
          </span>
          Export end-of-day report
        </DialogTitle>
        <DialogDescription>
          Choose the date and time range to include, then download it as Excel
          or CSV.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <div className="space-y-6">
          {/* Range */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted">
              <CalendarRange className="h-3.5 w-3.5" />
              Date &amp; time range
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_RANGES.map((q) => {
                const active = activeQuick?.label === q.label
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => {
                      const r = rangeFor(q.daysBack, q.days)
                      setFrom(r.from)
                      setTo(r.to)
                    }}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-xs font-bold transition',
                      active
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-surface text-primary-deep hover:border-primary/40 hover:bg-primary-50',
                    )}
                  >
                    {q.label}
                  </button>
                )
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="export-from">From</Label>
                <Input
                  id="export-from"
                  type="datetime-local"
                  value={from}
                  max={to || undefined}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="export-to">To</Label>
                <Input
                  id="export-to"
                  type="datetime-local"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>
            {rangeError ? (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-danger">
                <AlertTriangle className="h-3.5 w-3.5" />
                {rangeError}
              </p>
            ) : null}
          </section>

          {/* Scope */}
          <section className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Include
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Palengke</Label>
                <Select
                  value={branchId}
                  onValueChange={(value) => {
                    setBranchId(value)
                    // Drop a vendor selection that no longer belongs to this palengke.
                    const stillValid =
                      value === 'all' ||
                      vendors.find((v) => v.id === vendorId)?.branchId === value
                    if (!stillValid) setVendorId('all')
                  }}
                >
                  <SelectTrigger aria-label="Palengke">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All palengkes</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Vendor</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger aria-label="Vendor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All vendors</SelectItem>
                    {visibleVendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Order status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as StatusFilter)}
                >
                  <SelectTrigger aria-label="Order status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(
                      Object.keys(ORDER_STATUS_LABELS) as Exclude<
                        StatusFilter,
                        'all'
                      >[]
                    ).map((key) => (
                      <SelectItem key={key} value={key}>
                        {ORDER_STATUS_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Format */}
          <section className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
              File format
            </p>
            <div role="radiogroup" aria-label="File format" className="grid gap-3 sm:grid-cols-2">
              {FORMATS.map(({ value, title, hint, icon: Icon }) => {
                const active = format === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setFormat(value)}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border p-3.5 text-left transition',
                      active
                        ? 'border-primary bg-primary-50 ring-2 ring-primary/20'
                        : 'border-border bg-surface hover:border-primary/40',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        active ? 'bg-primary text-white' : 'bg-primary-100 text-primary',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-primary-deep">
                        {title}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">{hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Preview */}
          <section
            className={cn(
              'rounded-2xl border p-4',
              scoped.length === 0
                ? 'border-gold/50 bg-gold-50'
                : 'border-primary/20 bg-primary-50/70',
            )}
            aria-live="polite"
          >
            {rangeError ? (
              <p className="text-sm text-muted">Fix the date range to see a preview.</p>
            ) : scoped.length === 0 ? (
              <p className="flex items-start gap-2 text-sm font-semibold text-primary-deep">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                No orders match this range and filters. Try widening them.
              </p>
            ) : (
              <dl className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <dd className="text-xl font-extrabold text-primary-deep">
                    {scoped.length}
                  </dd>
                  <dt className="text-[11px] font-semibold text-muted">Orders</dt>
                </div>
                <div>
                  <dd className="text-xl font-extrabold text-primary-deep">
                    {totals.confirmed}
                  </dd>
                  <dt className="text-[11px] font-semibold text-muted">Confirmed</dt>
                </div>
                <div>
                  <dd className="text-xl font-extrabold text-primary-deep">
                    {formatPeso(totals.confirmedGross)}
                  </dd>
                  <dt className="text-[11px] font-semibold text-muted">Confirmed sales</dt>
                </div>
              </dl>
            )}
          </section>
        </div>
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleExport}
          disabled={busy || !!rangeError || scoped.length === 0}
        >
          <Download className="h-4 w-4" />
          {busy ? 'Preparing…' : `Download ${format === 'xlsx' ? 'Excel' : 'CSV'}`}
        </Button>
      </DialogFooter>
    </>
  )
}
