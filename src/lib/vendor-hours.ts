import type { Vendor } from '@/types'

/** Parse `HH:mm` into minutes since midnight. Returns null if invalid. */
export function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }
  return hours * 60 + minutes
}

export function formatVendorTime(time: string): string {
  const minutes = parseTimeToMinutes(time)
  if (minutes === null) return time
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function minutesNow(now: Date): number {
  return now.getHours() * 60 + now.getMinutes()
}

/** True when local time is at or past the vendor's order cut-off. */
export function isPastCutoff(vendor: Pick<Vendor, 'cutoffTime'>, now = new Date()): boolean {
  const cutoff = parseTimeToMinutes(vendor.cutoffTime)
  if (cutoff === null) return false
  return minutesNow(now) >= cutoff
}

/** True when the vendor is manually open and within opensAt–cutoffTime. */
export function isVendorAcceptingOrders(
  vendor: Pick<Vendor, 'isAvailable' | 'opensAt' | 'cutoffTime'>,
  now = new Date(),
): boolean {
  if (!vendor.isAvailable) return false

  const opens = parseTimeToMinutes(vendor.opensAt)
  const cutoff = parseTimeToMinutes(vendor.cutoffTime)
  const current = minutesNow(now)

  if (opens !== null && current < opens) return false
  if (cutoff !== null && current >= cutoff) return false
  return true
}
