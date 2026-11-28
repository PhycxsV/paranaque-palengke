import { useEffect, useState } from 'react'
import { Notice } from '@/components/shared/Notice'

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function ReservationCountdownNotice({
  expiresAt,
  onExpired,
}: {
  expiresAt?: string
  onExpired?: () => void
}) {
  const targetMs = expiresAt ? Date.parse(expiresAt) : NaN
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!Number.isFinite(targetMs)) return
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [targetMs])

  const remainingMs = Number.isFinite(targetMs) ? targetMs - now : NaN
  const expired = Number.isFinite(remainingMs) && remainingMs <= 0

  useEffect(() => {
    if (expired && onExpired) {
      onExpired()
    }
  }, [expired, onExpired])

  if (!Number.isFinite(targetMs)) return null

  if (expired) {
    return (
      <Notice tone="danger" title="10-minute payment window expired">
        Your stock reservation has ended so other shoppers are no longer locked
        out. Do not send payment now — place a new order if the item is still in
        stock.
      </Notice>
    )
  }

  return (
    <Notice
      tone={remainingMs <= 2 * 60 * 1000 ? 'warning' : 'info'}
      title={`Items reserved for ${formatRemaining(remainingMs)}`}
    >
      Your items are locked for you while you pay. Upload your proof of payment
      within 10 minutes — once submitted, the lock stays on until the vendor
      confirms.
    </Notice>
  )
}
