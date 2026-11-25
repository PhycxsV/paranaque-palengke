import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import { seedCommodities } from '@/data/commodities'
import {
  createCommodity,
  fetchPriceHistory,
  isApiConfigured,
  updateCommodityPriceRange,
} from '@/lib/api'
import { generateId } from '@/lib/utils'
import type { Commodity, CommodityFormInput, PriceHistoryEntry } from '@/types'

interface CommodityState {
  commodities: Commodity[]
  priceHistory: PriceHistoryEntry[]
  addCommodity: (
    input: CommodityFormInput,
  ) => Promise<{ ok: true; commodity: Commodity } | { ok: false; message: string }>
  updatePriceRange: (input: {
    commodityId: string
    priceMin: number
    priceMax: number
    effectiveFrom: string
    note?: string
  }) => Promise<{ ok: true } | { ok: false; message: string }>
  resetCommodities: () => void
}

export const useCommodityStore = create<CommodityState>()(
  persist(
    (set, get) => ({
      commodities: isApiConfigured() ? [] : seedCommodities,
      priceHistory: [],
      addCommodity: async (input) => {
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

        if (isApiConfigured()) {
          try {
            const commodity = await createCommodity(input)
            set({ commodities: [commodity, ...get().commodities] })
            return { ok: true, commodity }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to create commodity.',
            }
          }
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
      updatePriceRange: async ({
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

        if (isApiConfigured()) {
          try {
            const updated = await updateCommodityPriceRange({
              commodityId,
              priceMin,
              priceMax,
              effectiveFrom,
            })
            let history = get().priceHistory
            try {
              history = await fetchPriceHistory()
            } catch {
              history = [
                {
                  id: generateId('PRICE'),
                  commodityId,
                  previousPriceMin: commodity.priceMin,
                  previousPriceMax: commodity.priceMax,
                  newPriceMin: updated.priceMin,
                  newPriceMax: updated.priceMax,
                  effectiveFrom,
                  changedAt: new Date().toISOString(),
                  note,
                },
                ...history,
              ]
            }
            set({
              commodities: get().commodities.map((c) =>
                c.id === commodityId ? updated : c,
              ),
              priceHistory: history,
            })
            return { ok: true }
          } catch (error) {
            return {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to update price range.',
            }
          }
        }

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
          commodities: isApiConfigured() ? [] : structuredClone(seedCommodities),
          priceHistory: [],
        }),
    }),
    {
      name: `${STORAGE_PREFIX}-commodities`,
      partialize: (state) =>
        isApiConfigured()
          ? {}
          : {
              commodities: state.commodities,
              priceHistory: state.priceHistory,
            },
      merge: (persisted, current) => {
        if (isApiConfigured()) return { ...current }
        const p = persisted as Partial<CommodityState> | undefined
        return { ...current, ...p }
      },
    },
  ),
)
