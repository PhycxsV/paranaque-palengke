import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedFeedback } from '@/data/feedback'
import { generateId } from '@/lib/utils'
import type { VendorFeedback } from '@/types'

interface FeedbackInput {
  vendorId: string
  orderId?: string
  customerName: string
  rating: number
  comment: string
}

interface FeedbackState {
  feedback: VendorFeedback[]
  addFeedback: (
    input: FeedbackInput,
  ) => { ok: true; feedback: VendorFeedback } | { ok: false; message: string }
  getByVendor: (vendorId: string) => VendorFeedback[]
  getByOrder: (orderId: string) => VendorFeedback | undefined
  resetFeedback: () => void
}

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set, get) => ({
      feedback: seedFeedback,
      addFeedback: (input) => {
        if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
          return { ok: false, message: 'Choose a rating from 1 to 5 stars.' }
        }
        const comment = input.comment.trim()
        if (comment.length > 500) {
          return { ok: false, message: 'Feedback must be 500 characters or fewer.' }
        }
        if (input.orderId && get().feedback.some((f) => f.orderId === input.orderId)) {
          return { ok: false, message: 'You already left feedback for this order.' }
        }
        const feedback: VendorFeedback = {
          id: generateId('FB'),
          vendorId: input.vendorId,
          orderId: input.orderId,
          customerName: input.customerName.trim() || 'Customer',
          rating: input.rating,
          comment,
          createdAt: new Date().toISOString(),
        }
        set({ feedback: [feedback, ...get().feedback] })
        return { ok: true, feedback }
      },
      getByVendor: (vendorId) =>
        get()
          .feedback.filter((f) => f.vendorId === vendorId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      getByOrder: (orderId) => get().feedback.find((f) => f.orderId === orderId),
      resetFeedback: () => set({ feedback: structuredClone(seedFeedback) }),
    }),
    { name: `${STORAGE_PREFIX}-feedback` },
  ),
)

export interface FeedbackSummary {
  count: number
  average: number
  /** Index 0 = 1 star … index 4 = 5 stars. */
  distribution: [number, number, number, number, number]
}

export function summarizeFeedback(list: VendorFeedback[]): FeedbackSummary {
  const distribution: FeedbackSummary['distribution'] = [0, 0, 0, 0, 0]
  let total = 0
  for (const item of list) {
    distribution[item.rating - 1] += 1
    total += item.rating
  }
  return {
    count: list.length,
    average: list.length ? total / list.length : 0,
    distribution,
  }
}
