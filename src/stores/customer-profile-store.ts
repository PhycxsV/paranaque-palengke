import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_PREFIX } from '@/constants'
import type { CheckoutFormInput } from '@/types'

export interface CustomerProfile {
  name: string
  contactNumber: string
  deliveryAddress: string
  /** Default notes prefilled on checkout (optional). */
  notes: string
}

interface CustomerProfileState {
  profile: CustomerProfile
  /** True once the customer has saved at least once (profile page or checkout). */
  hasSaved: boolean
  updateProfile: (patch: Partial<CustomerProfile>) => void
  /** Copy checkout form values into the saved profile. */
  saveFromCheckout: (form: CheckoutFormInput) => void
  resetProfile: () => void
}

export const EMPTY_CUSTOMER_PROFILE: CustomerProfile = {
  name: '',
  contactNumber: '',
  deliveryAddress: '',
  notes: '',
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
          if (patch.notes !== undefined) next.notes = patch.notes.trim()
          return { hasSaved: true, profile: next }
        }),
      saveFromCheckout: (form) =>
        set({
          hasSaved: true,
          profile: {
            name: form.customerName.trim(),
            contactNumber: form.contactNumber.trim(),
            deliveryAddress: form.deliveryAddress.trim(),
            notes: form.notes?.trim() ?? '',
          },
        }),
      resetProfile: () =>
        set({ profile: { ...EMPTY_CUSTOMER_PROFILE }, hasSaved: false }),
    }),
    { name: `${STORAGE_PREFIX}-customer-profile` },
  ),
)

/** Checkout form seeded from the saved profile. */
export function profileToCheckoutForm(
  profile: CustomerProfile,
): CheckoutFormInput {
  return {
    customerName: profile.name,
    contactNumber: profile.contactNumber,
    deliveryAddress: profile.deliveryAddress,
    notes: profile.notes,
  }
}
