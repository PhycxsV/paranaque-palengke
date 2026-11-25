import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

/** Sign out after this much idle time while a session is active. */
export const IDLE_LOGOUT_MS = 30 * 60 * 1000

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'pointerdown',
  'keydown',
  'mousemove',
  'scroll',
  'touchstart',
  'wheel',
]

/**
 * Logs the user out after IDLE_LOGOUT_MS with no input.
 * Does not conflict with the 7-day JWT — idle can end the session sooner.
 */
export function useIdleLogout(idleMs: number = IDLE_LOGOUT_MS) {
  const jwt = useAuthStore((s) => s.jwt)
  const logout = useAuthStore((s) => s.logout)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!jwt) return

    const clearTimer = () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const signOutIdle = () => {
      clearTimer()
      logout()
      toast.message("You've been signed out", {
        description: 'Signed out after being idle too long. Please sign in again.',
      })
    }

    const bump = () => {
      clearTimer()
      timerRef.current = window.setTimeout(signOutIdle, idleMs)
    }

    bump()
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, bump, { passive: true })
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') bump()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearTimer()
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, bump)
      }
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [jwt, logout, idleMs])
}
