import { useState } from 'react'
import { MessageSquareHeart, Send } from 'lucide-react'
import { toast } from 'sonner'
import { FeedbackCard, StarInput } from '@/components/shared/FeedbackParts'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useFeedbackStore } from '@/stores/feedback-store'
import type { Order } from '@/types'

const MAX_COMMENT = 500

/** Lets the customer rate the vendor once for a confirmed order. */
export function RateVendorCard({ order }: { order: Order }) {
  const existing = useFeedbackStore((s) =>
    s.feedback.find((f) => f.orderId === order.id),
  )
  const addFeedback = useFeedbackStore((s) => s.addFeedback)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  if (order.status !== 'confirmed') return null

  if (existing) {
    return (
      <SectionCard title="Your feedback" icon={MessageSquareHeart}>
        <ul>
          <FeedbackCard item={existing} />
        </ul>
        <p className="mt-3 text-xs text-muted">
          Thank you! {order.vendorName} and the LGU can see your feedback.
        </p>
      </SectionCard>
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const result = addFeedback({
      vendorId: order.vendorId,
      orderId: order.id,
      customerName: order.customerName,
      rating,
      comment,
    })
    if (result.ok) {
      toast.success('Thanks for your feedback!')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <SectionCard title={`Rate ${order.vendorName}`} icon={MessageSquareHeart}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">
          How was your order? Your feedback helps other customers and keeps vendors
          accountable.
        </p>
        <StarInput value={rating} onChange={setRating} />
        <div className="space-y-1.5">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
            placeholder="Tell us more (optional) — freshness, packing, service…"
            rows={3}
            aria-label="Feedback comment"
          />
          <p className="text-right text-[11px] text-muted">
            {comment.length}/{MAX_COMMENT}
          </p>
        </div>
        <Button type="submit" disabled={rating === 0} className="w-full sm:w-auto">
          <Send className="h-4 w-4" />
          Submit feedback
        </Button>
      </form>
    </SectionCard>
  )
}
