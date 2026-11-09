import { useMemo, useState } from 'react'
import { MessageSquareHeart } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { FeedbackCard, RatingSummary } from '@/components/shared/FeedbackParts'
import { FilterTabs, type FilterTabItem } from '@/components/shared/FilterTabs'
import { PortalHeader } from '@/components/shared/PortalHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { summarizeFeedback, useFeedbackStore } from '@/stores/feedback-store'

type StarFilter = 'all' | '5' | '4' | '3' | '2' | '1'

export default function VendorFeedbackPage() {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const allFeedback = useFeedbackStore((s) => s.feedback)
  const [filter, setFilter] = useState<StarFilter>('all')

  const mine = useMemo(
    () =>
      allFeedback
        .filter((f) => f.vendorId === activeVendorId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allFeedback, activeVendorId],
  )
  const summary = useMemo(() => summarizeFeedback(mine), [mine])

  const tabs = useMemo<FilterTabItem<StarFilter>[]>(
    () => [
      { value: 'all', label: 'All', count: mine.length },
      ...(['5', '4', '3', '2', '1'] as const).map((s) => ({
        value: s,
        label: `${s}★`,
        count: summary.distribution[Number(s) - 1],
      })),
    ],
    [mine.length, summary.distribution],
  )

  const visible =
    filter === 'all' ? mine : mine.filter((f) => String(f.rating) === filter)

  return (
    <div className="space-y-6">
      <PortalHeader
        eyebrow="Vendor portal"
        title="Customer feedback"
        description="See what customers say about your store. Ratings come from confirmed orders."
      />

      {mine.length === 0 ? (
        <EmptyState
          icon={MessageSquareHeart}
          title="No feedback yet"
          description="After a customer's order is confirmed they can rate you. Their reviews will show up here."
        />
      ) : (
        <>
          <SectionCard title="Your rating" icon={MessageSquareHeart}>
            <RatingSummary summary={summary} />
          </SectionCard>

          <FilterTabs items={tabs} value={filter} onChange={setFilter} />

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
              No reviews with this rating.
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {visible.map((item) => (
                <FeedbackCard key={item.id} item={item} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
