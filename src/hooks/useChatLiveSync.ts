import { useEffect } from 'react'
import {
  fetchChatMessages,
  fetchChatThreads,
  getStoredToken,
  isApiConfigured,
} from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { useChatStore } from '@/stores/chat-store'

/**
 * Polls chat threads/messages so customer and vendor views pick up
 * new replies without a full page reload.
 */
export function useChatLiveSync(options?: {
  enabled?: boolean
  intervalMs?: number
}) {
  const enabled = options?.enabled ?? true
  const intervalMs = options?.intervalMs ?? 4_000
  const jwt = useAuthStore((s) => s.jwt)
  const role = useAuthStore((s) => s.user?.role)
  const hasSession = Boolean(jwt || getStoredToken())
  const canChat = role === 'customer' || role === 'vendor'

  useEffect(() => {
    if (!enabled || !hasSession || !canChat || !isApiConfigured()) return

    let cancelled = false
    let inFlight = false

    async function refresh() {
      if (cancelled || inFlight) return
      inFlight = true
      try {
        const [threads, messages] = await Promise.all([
          fetchChatThreads(),
          fetchChatMessages(),
        ])
        if (cancelled) return

        useChatStore.setState((state) => {
          const threadMap = new Map(threads.map((thread) => [thread.id, thread]))
          const mergedThreads = state.threads.map((local) => {
            const remote = threadMap.get(local.id)
            if (!remote) return local
            threadMap.delete(local.id)
            return {
              ...local,
              ...remote,
              lastMessagePreview:
                remote.lastMessagePreview || local.lastMessagePreview,
              customerLastReadAt:
                remote.customerLastReadAt || local.customerLastReadAt,
              vendorLastReadAt:
                remote.vendorLastReadAt || local.vendorLastReadAt,
              updatedAt:
                remote.updatedAt > local.updatedAt
                  ? remote.updatedAt
                  : local.updatedAt,
            }
          })
          for (const remote of threadMap.values()) mergedThreads.push(remote)

          const messageMap = new Map(messages.map((message) => [message.id, message]))
          const mergedMessages = state.messages.map((local) => {
            const remote = messageMap.get(local.id)
            if (!remote) return local
            messageMap.delete(local.id)
            return remote
          })
          for (const remote of messageMap.values()) mergedMessages.push(remote)

          return {
            threads: mergedThreads,
            messages: mergedMessages,
          }
        })
      } catch {
        // Keep the last known chat state if the poll fails.
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
  }, [enabled, intervalMs, hasSession, canChat])
}
