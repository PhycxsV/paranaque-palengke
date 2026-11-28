import { useEffect } from 'react'
import {
  fetchOrders,
  getStoredToken,
  isApiConfigured,
} from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { useOrderStore } from '@/stores/order-store'

/**
 * Keeps the local order store in sync with the API so customer views
 * pick up vendor confirmations / delivery advances without a full reload.
 */
export function useOrdersLiveSync(options?: {
  enabled?: boolean
  intervalMs?: number
}) {
  const enabled = options?.enabled ?? true
  const intervalMs = options?.intervalMs ?? 4_000
  const jwt = useAuthStore((s) => s.jwt)
  const hasSession = Boolean(jwt || getStoredToken())

  useEffect(() => {
    if (!enabled || !hasSession || !isApiConfigured()) return

    let cancelled = false
    let inFlight = false

    async function refresh() {
      if (cancelled || inFlight) return
      inFlight = true
      try {
        const orders = await fetchOrders()
        if (cancelled) return

        // Merge by id so we always apply newer API status/delivery fields
        // even if a concurrent local write happened mid-poll.
        useOrderStore.setState((state) => {
          const incoming = new Map(orders.map((order) => [order.id, order]))
          const merged = state.orders.map((local) => {
            const remote = incoming.get(local.id)
            if (!remote) return local
            incoming.delete(local.id)
            return {
              ...local,
              ...remote,
              // Prefer API workflow fields.
              status: remote.status,
              deliveryStatus: remote.deliveryStatus,
              transactionReference: remote.transactionReference,
              paymentSubmittedAt: remote.paymentSubmittedAt,
              reservationExpiresAt: remote.reservationExpiresAt,
              cancelledBy: remote.cancelledBy,
              cancelledAt: remote.cancelledAt,
              cancelReason: remote.cancelReason,
              keriTrackingId: remote.keriTrackingId,
              podUrl: remote.podUrl,
              paymentProofUrl: remote.paymentProofUrl,
              pickupCode: remote.pickupCode,
              updatedAt: remote.updatedAt,
              items: remote.items?.length ? remote.items : local.items,
            }
          })
          for (const remote of incoming.values()) merged.unshift(remote)
          merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          return { orders: merged }
        })
      } catch {
        // Keep the last known orders if the poll fails.
      } finally {
        inFlight = false
      }
    }

    void refresh()
    const timer = window.setInterval(() => {
      void refresh()
    }, intervalMs)

    const onFocus = () => {
      void refresh()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, intervalMs, hasSession])
}
