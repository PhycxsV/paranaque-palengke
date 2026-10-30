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
  updatePriceRange: (input: {
    commodityId: string
    priceMin: number
    priceMax: number
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
        if (
          !Number.isFinite(input.priceMin) ||
          !Number.isFinite(input.priceMax) ||
          input.priceMin <= 0 ||
          input.priceMax <= 0
        ) {
          return { ok: false, message: 'Enter a valid price range.' }
        }
        if (input.priceMin > input.priceMax) {
          return { ok: false, message: 'Min price cannot exceed max price.' }
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
          priceMin: Number(input.priceMin.toFixed(2)),
          priceMax: Number(input.priceMax.toFixed(2)),
          imageUrl,
          effectiveFrom: now,
          isActive: input.isActive,
        }

        set({ commodities: [commodity, ...get().commodities] })
        return { ok: true, commodity }
      },
      updatePriceRange: ({
        commodityId,
        priceMin,
        priceMax,
        effectiveFrom,
        note,
      }) => {
        if (
          !Number.isFinite(priceMin) ||
          !Number.isFinite(priceMax) ||
          priceMin <= 0 ||
          priceMax <= 0
        ) {
          return { ok: false, message: 'Enter a valid price range.' }
        }
        if (priceMin > priceMax) {
          return { ok: false, message: 'Min price cannot exceed max price.' }
        }
        const commodity = get().commodities.find((c) => c.id === commodityId)
        if (!commodity) return { ok: false, message: 'Commodity not found.' }

        const entry: PriceHistoryEntry = {
          id: generateId('PRICE'),
          commodityId,
          previousPriceMin: commodity.priceMin,
          previousPriceMax: commodity.priceMax,
          newPriceMin: Number(priceMin.toFixed(2)),
          newPriceMax: Number(priceMax.toFixed(2)),
          effectiveFrom,
          changedAt: new Date().toISOString(),
          note,
        }

        set({
          commodities: get().commodities.map((c) =>
            c.id === commodityId
              ? {
                  ...c,
                  priceMin: entry.newPriceMin,
                  priceMax: entry.newPriceMax,
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
