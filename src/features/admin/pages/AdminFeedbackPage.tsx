import { useMemo, useState } from 'react'
import { MessageSquareHeart, Star, TriangleAlert, Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  FeedbackCard,
  StarRating,
} from '@/components/shared/FeedbackParts'
import { FilterTabs, type FilterTabItem } from '@/components/shared/FilterTabs'
import { PortalHeader } from '@/components/shared/PortalHeader'
import { StatCard } from '@/components/shared/StatCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useBranchStore } from '@/stores/branch-store'
import { summarizeFeedback, useFeedbackStore } from '@/stores/feedback-store'
import { useVendorStore } from '@/stores/vendor-store'

type StarFilter = 'all' | '5' | '4' | '3' | '2' | '1'

export default function AdminFeedbackPage() {
  const vendors = useVendorStore((s) => s.vendors)
  const branches = useBranchStore((s) => s.branches)
  const feedback = useFeedbackStore((s) => s.feedback)

  const [vendorId, setVendorId] = useState('all')
  const [stars, setStars] = useState<StarFilter>('all')

  const sorted = useMemo(
    () => [...feedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [feedback],
  )
  const overall = useMemo(() => summarizeFeedback(sorted), [sorted])
  const lowCount = overall.distribution[0] + overall.distribution[1]

  const perVendor = useMemo(
    () =>
      vendors
        .map((vendor) => {
          const list = sorted.filter((f) => f.vendorId === vendor.id)
          return {
            vendor,
            summary: summarizeFeedback(list),
            branchName: branches.find((b) => b.id === vendor.branchId)?.name ?? '—',
          }
        })
        .sort(
          (a, b) =>
            b.summary.average - a.summary.average ||
            b.summary.count - a.summary.count,
        ),
    [vendors, sorted, branches],
  )

  const scoped = vendorId === 'all' ? sorted : sorted.filter((f) => f.vendorId === vendorId)
  const scopedSummary = useMemo(() => summarizeFeedback(scoped), [scoped])
  const visible = stars === 'all' ? scoped : scoped.filter((f) => String(f.rating) === stars)

  const tabs = useMemo<FilterTabItem<StarFilter>[]>(
    () => [
      { value: 'all', label: 'All', count: scoped.length },
      ...(['5', '4', '3', '2', '1'] as const).map((s) => ({
        value: s,
        label: `${s}★`,
        count: scopedSummary.distribution[Number(s) - 1],
      })),
    ],
    [scoped.length, scopedSummary.distribution],
  )

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? 'Unknown vendor'

  return (
    <div className="space-y-6">
      <PortalHeader
        eyebrow="LGU Admin"
        title="Vendor feedback"
        description="Customer ratings and comments per vendor. Use it to spot standout stalls and ones that need a follow-up."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Average rating"
          value={overall.count ? overall.average.toFixed(1) : '–'}
          icon={Star}
          tone="gold"
          hint="across all vendors"
        />
        <StatCard
          label="Reviews"
          value={overall.count}
          icon={Users}
          tone="primary"
          hint="from customers"
        />
        <StatCard
          label="Low ratings"
          value={lowCount}
          icon={TriangleAlert}
          tone={lowCount > 0 ? 'danger' : 'neutral'}
          hint="1–2 stars"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Per vendor */}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
        <div className="border-b border-border bg-gradient-to-r from-primary-50/80 to-transparent px-5 py-3.5">
          <h2 className="text-sm font-extrabold text-primary-deep">Rating per vendor</h2>
        </div>
        <ul className="divide-y divide-border">
          {perVendor.map(({ vendor, summary, branchName }) => {
            const active = vendorId === vendor.id
            return (
              <li key={vendor.id}>
                <button
                  type="button"
                  onClick={() => setVendorId(active ? 'all' : vendor.id)}
                  aria-pressed={active}
                  className={cn(
                    'flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 text-left transition hover:bg-primary-50/60',
                    active && 'bg-primary-50',
                  )}
                >
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-sm font-bold text-primary-deep">
                      {vendor.name}
                    </p>
                    <p className="truncate text-xs text-muted">{branchName}</p>
                  </div>
                  <StarRating value={summary.average} />
                  <p className="w-24 text-right text-sm">
                    <span className="font-extrabold text-primary-deep">
                      {summary.count ? summary.average.toFixed(1) : '–'}
                    </span>{' '}
                    <span className="text-xs text-muted">
                      ({summary.count})
                    </span>
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Reviews */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs items={tabs} value={stars} onChange={setStars} />
          <div className="w-full lg:w-64">
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger aria-label="Filter by vendor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All vendors</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={MessageSquareHeart}
            title="No feedback found"
            description="Nothing matches this filter yet."
          />
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {visible.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                vendorName={vendorName(item.vendorId)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
