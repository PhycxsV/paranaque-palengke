import { useEffect } from 'react'
import { fetchProducts, isApiConfigured } from '@/lib/api'
import { useProductStore } from '@/stores/product-store'

/**
 * Periodically refreshes the product catalog from the API so `stock` and
 * `reservedStock` reflect other shoppers' checkouts, cancellations, and
 * 10-minute reservation expirations without a manual page reload.
 */
export function useProductsLiveSync(options?: {
  enabled?: boolean
  intervalMs?: number
}) {
  const enabled = options?.enabled ?? true
  const intervalMs = options?.intervalMs ?? 8_000

  useEffect(() => {
    if (!enabled || !isApiConfigured()) return

    let cancelled = false
    let inFlight = false

    async function refresh() {
      if (cancelled || inFlight) return
      inFlight = true
      try {
        const products = await fetchProducts()
        if (!cancelled) {
          useProductStore.setState({ products })
        }
      } catch {
        // Keep last known catalog snapshot on transient network hiccups.
      } finally {
        inFlight = false
      }
    }

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
  }, [enabled, intervalMs])
}
