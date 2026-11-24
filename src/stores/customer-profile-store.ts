import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import {
  fetchCustomerProfile,
  isApiConfigured,
  updateCustomerProfile,
  type CustomerProfileUpdateInput,
} from '@/lib/api'
import type { CheckoutFormInput } from '@/types'

export interface CustomerProfile {
  name: string
  contactNumber: string
  /** Drop-off address (`dropoffAddress` in the API). */
  deliveryAddress: string
  /** Drop-off pin latitude, or `null` until set. */
  dropoffLat: number | null
  /** Drop-off pin longitude, or `null` until set. */
  dropoffLng: number | null
  /** Landmark / handoff hint for the rider. */
  dropoffLandmark: string
  /** What the customer picked in Find place, kept so the search box isn't empty after a reload. */
  dropoffPlace: string
  /** Default notes prefilled on checkout (optional). */
  notes: string
  /** Local profile photo as a data URL. */
  photoUrl: string
}

interface CustomerProfileState {
  profile: CustomerProfile
  /** True once the customer has saved at least once (profile page or checkout). */
  hasSaved: boolean
  updateProfile: (patch: Partial<CustomerProfile>) => void
  /** Merge profile fields loaded from the API (keeps the local photo). */
  applyRemoteProfile: (remote: Partial<Omit<CustomerProfile, 'photoUrl'>>) => void
  /** Copy checkout form values into the saved profile. */
  saveFromCheckout: (form: CheckoutFormInput) => void
  resetProfile: () => void
}

export const EMPTY_CUSTOMER_PROFILE: CustomerProfile = {
  name: '',
  contactNumber: '',
  deliveryAddress: '',
  dropoffLat: null,
  dropoffLng: null,
  dropoffLandmark: '',
  dropoffPlace: '',
  notes: '',
  photoUrl: '',
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export const useCustomerProfileStore = create<CustomerProfileState>()(
  persist(
    (set) => ({
      profile: { ...EMPTY_CUSTOMER_PROFILE },
      hasSaved: false,
      updateProfile: (patch) =>
        set((state) => {
          const next = { ...state.profile }
          if (patch.name !== undefined) next.name = patch.name.trim()
          if (patch.contactNumber !== undefined) {
            next.contactNumber = patch.contactNumber.trim()
          }
          if (patch.deliveryAddress !== undefined) {
            next.deliveryAddress = patch.deliveryAddress.trim()
          }
          if (patch.dropoffLat !== undefined) {
            next.dropoffLat = finiteOrNull(patch.dropoffLat)
          }
          if (patch.dropoffLng !== undefined) {
            next.dropoffLng = finiteOrNull(patch.dropoffLng)
          }
          if (patch.dropoffLandmark !== undefined) {
            next.dropoffLandmark = patch.dropoffLandmark.trim()
          }
          if (patch.dropoffPlace !== undefined) {
            next.dropoffPlace = patch.dropoffPlace.trim()
          }
          if (patch.notes !== undefined) next.notes = patch.notes.trim()
          if (patch.photoUrl !== undefined) next.photoUrl = patch.photoUrl
          return { hasSaved: true, profile: next }
        }),
      applyRemoteProfile: (remote) =>
        set((state) => {
          const next = { ...state.profile }
          if (remote.name?.trim()) next.name = remote.name.trim()
          if (remote.contactNumber?.trim()) {
            next.contactNumber = remote.contactNumber.trim()
          }
          if (remote.deliveryAddress !== undefined) {
            next.deliveryAddress = remote.deliveryAddress.trim()
          }
          if (remote.dropoffLat !== undefined) {
            next.dropoffLat = finiteOrNull(remote.dropoffLat)
          }
          if (remote.dropoffLng !== undefined) {
            next.dropoffLng = finiteOrNull(remote.dropoffLng)
          }
          if (remote.dropoffLandmark !== undefined) {
            next.dropoffLandmark = remote.dropoffLandmark.trim()
          }
          if (remote.dropoffPlace !== undefined) {
            next.dropoffPlace = remote.dropoffPlace.trim()
          }
          if (remote.notes !== undefined) next.notes = remote.notes.trim()
          return {
            hasSaved: state.hasSaved || Boolean(next.deliveryAddress),
            profile: next,
          }
        }),
      saveFromCheckout: (form) =>
        set((state) => ({
          hasSaved: true,
          profile: {
            ...state.profile,
            name: form.customerName.trim(),
            contactNumber: form.contactNumber.trim(),
            deliveryAddress: form.deliveryAddress.trim(),
            dropoffLat: finiteOrNull(form.dropoffLat),
            dropoffLng: finiteOrNull(form.dropoffLng),
            dropoffLandmark: form.dropoffLandmark.trim(),
            notes: form.notes?.trim() ?? '',
          },
        })),
      resetProfile: () =>
        set({ profile: { ...EMPTY_CUSTOMER_PROFILE }, hasSaved: false }),
    }),
    {
      name: `${STORAGE_PREFIX}-customer-profile`,
      merge: (persisted, current) => {
        const p = persisted as Partial<CustomerProfileState> | undefined
        return {
          ...current,
          ...p,
          profile: {
            ...EMPTY_CUSTOMER_PROFILE,
            ...(p?.profile ?? {}),
            dropoffLat: finiteOrNull(p?.profile?.dropoffLat),
            dropoffLng: finiteOrNull(p?.profile?.dropoffLng),
            dropoffLandmark: p?.profile?.dropoffLandmark ?? '',
            dropoffPlace: p?.profile?.dropoffPlace ?? '',
            photoUrl: p?.profile?.photoUrl ?? '',
          },
        }
      },
    },
  ),
)

/** Loads the profile from the API into the local cache. Returns false when skipped or failed. */
export async function hydrateCustomerProfile(): Promise<boolean> {
  if (!isApiConfigured()) return false
  try {
    const remote = await fetchCustomerProfile()
    useCustomerProfileStore.getState().applyRemoteProfile(remote)
    return true
  } catch {
    // Keep the local cache when the profile endpoint is unavailable.
    return false
  }
}

/** Persists drop-off details to the API, then mirrors the response into the local cache. */
export async function persistCustomerProfile(
  input: CustomerProfileUpdateInput,
): Promise<void> {
  const remote = await updateCustomerProfile(input)
  useCustomerProfileStore.getState().applyRemoteProfile(remote)
}

/** Checkout form seeded from the saved profile. */
export function profileToCheckoutForm(
  profile: CustomerProfile,
): CheckoutFormInput {
  return {
    customerName: profile.name,
    contactNumber: profile.contactNumber,
    deliveryAddress: profile.deliveryAddress,
    dropoffLat: profile.dropoffLat,
    dropoffLng: profile.dropoffLng,
    dropoffLandmark: profile.dropoffLandmark,
    notes: profile.notes,
  }
}
