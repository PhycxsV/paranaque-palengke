import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedCommodities } from '@/data/commodities'
import { generateId } from '@/lib/utils'
import type { Commodity, PriceHistoryEntry } from '@/types'

interface CommodityState {
  commodities: Commodity[]
  priceHistory: PriceHistoryEntry[]
  updateStandardPrice: (input: {
    commodityId: string
    standardPrice: number
    effectiveFrom: string
    note?: string
  }) => { ok: true } | { ok: false; message: string }
  resetCommodities: () => void
}

export const useCommodityStore = create<CommodityState>()(
  persist(
    (set, get) => ({
      commodities: seedCommodities,
      priceHistory: [],
      updateStandardPrice: ({ commodityId, standardPrice, effectiveFrom, note }) => {
        if (!Number.isFinite(standardPrice) || standardPrice <= 0) {
          return { ok: false, message: 'Enter a valid standard price.' }
        }
        const commodity = get().commodities.find((c) => c.id === commodityId)
        if (!commodity) return { ok: false, message: 'Commodity not found.' }

        const entry: PriceHistoryEntry = {
          id: generateId('PRICE'),
          commodityId,
          previousPrice: commodity.standardPrice,
          newPrice: Number(standardPrice.toFixed(2)),
          effectiveFrom,
          changedAt: new Date().toISOString(),
          note,
        }

        set({
          commodities: get().commodities.map((c) =>
            c.id === commodityId
              ? {
                  ...c,
                  standardPrice: entry.newPrice,
                  effectiveFrom,
                }
              : c,
          ),
          priceHistory: [entry, ...get().priceHistory],
        })
        return { ok: true }
      },
      resetCommodities: () =>
        set({
          commodities: structuredClone(seedCommodities),
          priceHistory: [],
        }),
    }),
    {
      name: `${STORAGE_PREFIX}-commodities`,
    },
  ),
)
