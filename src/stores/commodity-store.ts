import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedCommodities } from '@/data/commodities'
import { generateId } from '@/lib/utils'
import type { Commodity, CommodityFormInput, PriceHistoryEntry } from '@/types'

interface CommodityState {
  commodities: Commodity[]
  priceHistory: PriceHistoryEntry[]
  addCommodity: (
    input: CommodityFormInput,
  ) => { ok: true; commodity: Commodity } | { ok: false; message: string }
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
      addCommodity: (input) => {
        const name = input.name.trim()
        const description = input.description.trim()
        const imageUrl = input.imageUrl.trim()
        if (!name) return { ok: false, message: 'Commodity name is required.' }
        if (!description) {
          return { ok: false, message: 'Description is required.' }
        }
        if (!Number.isFinite(input.standardPrice) || input.standardPrice <= 0) {
          return { ok: false, message: 'Enter a valid standard price.' }
        }
        if (!imageUrl) {
          return { ok: false, message: 'Image URL is required.' }
        }

        const duplicate = get().commodities.some(
          (c) => c.name.toLowerCase() === name.toLowerCase(),
        )
        if (duplicate) {
          return { ok: false, message: 'A commodity with that name already exists.' }
        }

        const now = new Date().toISOString()
        const commodity: Commodity = {
          id: generateId('COMM'),
          name,
          description,
          category: input.category,
          unit: input.unit,
          standardPrice: Number(input.standardPrice.toFixed(2)),
          imageUrl,
          effectiveFrom: now,
          isActive: input.isActive,
        }

        set({ commodities: [commodity, ...get().commodities] })
        return { ok: true, commodity }
      },
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
