import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import type { TextSize } from '@/types'

export const TEXT_SIZE_OPTIONS: {
  value: TextSize
  label: string
  /** Root font-size in percent — Tailwind sizes are rem based, so everything scales. */
  percent: number
}[] = [
  { value: 'small', label: 'Small', percent: 90 },
  { value: 'default', label: 'Default', percent: 100 },
  { value: 'large', label: 'Large', percent: 115 },
  { value: 'xlarge', label: 'Extra large', percent: 130 },
]

interface TextSizeState {
  size: TextSize
  setSize: (size: TextSize) => void
}

export const useTextSizeStore = create<TextSizeState>()(
  persist(
    (set) => ({
      size: 'default',
      setSize: (size) => set({ size }),
    }),
    // Shared across every portal — it is a personal accessibility setting.
    { name: `${STORAGE_PREFIX}-text-size` },
  ),
)

export function applyTextSize(size: TextSize) {
  if (typeof document === 'undefined') return
  const percent =
    TEXT_SIZE_OPTIONS.find((o) => o.value === size)?.percent ?? 100
  document.documentElement.style.fontSize = `${percent}%`
}

// Apply on load (persisted state is read synchronously) and whenever it changes.
applyTextSize(useTextSizeStore.getState().size)
useTextSizeStore.subscribe((state) => applyTextSize(state.size))
