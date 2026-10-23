import { ORDER_STATUS_LABELS } from '@/constants'
import type { OrderStatus } from '@/types'
import { Badge } from '@/components/ui/badge'

const statusVariant: Record<
  OrderStatus,
  'warning' | 'gold' | 'success' | 'danger'
> = {
  pending_payment: 'warning',
  awaiting_vendor_confirmation: 'gold',
  confirmed: 'success',
  payment_rejected: 'danger',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={statusVariant[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
  )
}
