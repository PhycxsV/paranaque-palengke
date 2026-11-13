import { Check, Package, PackageCheck, Truck } from 'lucide-react'
import { DELIVERY_MILESTONES } from '@/constants'
import { DELIVERY_FLOW, normalizeDeliveryStatus } from '@/lib/delivery'
import { cn } from '@/lib/utils'
import type { DeliveryStatus } from '@/types'

const ICONS = {
  packing: Package,
  ready_for_keri: PackageCheck,
  out_for_delivery: Truck,
  delivered: Check,
} as const

function stepIndex(status: DeliveryStatus): number {
  return DELIVERY_FLOW.indexOf(status)
}

interface DeliveryMilestoneTrackerProps {
  deliveryStatus: DeliveryStatus | string
  className?: string
}

export function DeliveryMilestoneTracker({
  deliveryStatus,
  className,
}: DeliveryMilestoneTrackerProps) {
  const current = stepIndex(normalizeDeliveryStatus(deliveryStatus))

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-6',
        className,
      )}
    >
      <span className="brand-ribbon absolute inset-x-0 top-0 h-1" aria-hidden />
      <div className="mb-1 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-50 text-primary ring-1 ring-lime/50">
          <Truck className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-bold text-primary-deep">Keri delivery</h2>
      </div>
      <p className="mb-6 text-xs text-muted">
        Track your order after payment confirmation.
      </p>

      <ol className="relative space-y-0">
        {DELIVERY_MILESTONES.map((milestone, index) => {
          const Icon = ICONS[milestone.id]
          const done = index < current
          const active = index === current
          const upcoming = index > current

          return (
            <li key={milestone.id} className="relative flex gap-4 pb-7 last:pb-0">
              {index < DELIVERY_MILESTONES.length - 1 ? (
                <span
                  className={cn(
                    'absolute left-[17px] top-9 h-[calc(100%-1.5rem)] w-0.5 rounded-full',
                    done ? 'bg-primary' : 'bg-border',
                  )}
                  aria-hidden
                />
              ) : null}
              <div
                className={cn(
                  'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  done && 'border-primary bg-primary text-white',
                  active &&
                    'border-primary bg-lime text-primary-deep ring-4 ring-lime/30',
                  upcoming && 'border-border bg-surface text-muted',
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 pt-1">
                <p
                  className={cn(
                    'text-sm',
                    active || done
                      ? 'font-bold text-primary-deep'
                      : 'font-medium text-muted',
                  )}
                >
                  {milestone.label}
                  {active ? (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Current
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-muted">{milestone.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
