import { OFFER_STATUS_LABELS } from '@/constants'
import { Badge } from '@/components/ui/badge'
import type { OfferStatus } from '@/types'

const statusVariant: Record<
  OfferStatus,
  'warning' | 'success' | 'danger' | 'gold' | 'muted'
> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  countered: 'gold',
  counter_accepted: 'success',
  counter_declined: 'muted',
}

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return (
    <Badge variant={statusVariant[status]}>
      {OFFER_STATUS_LABELS[status]}
    </Badge>
  )
}
