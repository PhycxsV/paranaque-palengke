import {
  ApiError,
  apiFetchAll,
  apiRequest,
  apiUpload,
  resolveMediaUrl,
} from './client'
import {
  mapBranch,
  mapCommodity,
  mapPriceHistory,
  mapProduct,
  mapVendor,
  mapVendorUser,
  type StrapiBranch,
  type StrapiCommodity,
  type StrapiMedia,
  type StrapiPriceHistory,
  type StrapiProduct,
  type StrapiUser,
  type StrapiVendor,
} from './mappers'
import type {
  Branch,
  BranchFormInput,
  Commodity,
  CommodityFormInput,
  PriceHistoryEntry,
  Product,
  ProductFormInput,
  Vendor,
  VendorCreateInput,
  VendorProfileInput,
  VendorUpdateInput,
  VendorUser,
} from '@/types'

export async function fetchBranches(): Promise<Branch[]> {
  const rows = await apiFetchAll<StrapiBranch>('/branches', {
    auth: false,
    query: { 'sort[0]': 'name:asc' },
  })
  return rows.map(mapBranch)
}

export async function createBranch(input: BranchFormInput): Promise<Branch> {
  const payload = await apiRequest<{ data: StrapiBranch }>('/branches', {
    method: 'POST',
    body: {
      data: {
        name: input.name.trim(),
        address: input.address.trim(),
        lat: input.lat,
        lng: input.lng,
        isActive: input.isActive,
      },
    },
  })
  return mapBranch(payload.data)
}

export async function updateBranch(
  branchId: string,
  input: BranchFormInput,
): Promise<Branch> {
  const payload = await apiRequest<{ data: StrapiBranch }>(`/branches/${branchId}`, {
    method: 'PUT',
    body: {
      data: {
        name: input.name.trim(),
        address: input.address.trim(),
        lat: input.lat,
        lng: input.lng,
        isActive: input.isActive,
      },
    },
  })
  return mapBranch(payload.data)
}

export async function fetchCommodities(): Promise<Commodity[]> {
  const rows = await apiFetchAll<StrapiCommodity>('/commodities', {
    auth: false,
    query: { 'sort[0]': 'name:asc' },
  })
  return rows.map(mapCommodity)
}

export async function fetchPriceHistory(): Promise<PriceHistoryEntry[]> {
  const rows = await apiFetchAll<StrapiPriceHistory>('/price-history-entries', {
    query: {
      'populate[commodity]': 'true',
      'sort[0]': 'changedAt:desc',
    },
  })
  return rows.map(mapPriceHistory)
}

export async function createCommodity(input: CommodityFormInput): Promise<Commodity> {
  const payload = await apiRequest<{ data: StrapiCommodity }>('/commodities', {
    method: 'POST',
    body: {
      data: {
        name: input.name.trim(),
        description: input.description.trim(),
        category: input.category,
        unit: input.unit,
        priceMin: input.priceMin,
        priceMax: input.priceMax,
        imageUrl: input.imageUrl.trim(),
        effectiveFrom: new Date().toISOString().slice(0, 10),
        isActive: input.isActive,
      },
    },
  })
  return mapCommodity(payload.data)
}

export async function updateCommodityPriceRange(input: {
  commodityId: string
  priceMin: number
  priceMax: number
  effectiveFrom: string
}): Promise<Commodity> {
  const payload = await apiRequest<{ data: StrapiCommodity }>(
    `/commodities/${input.commodityId}`,
    {
      method: 'PUT',
      body: {
        data: {
          priceMin: input.priceMin,
          priceMax: input.priceMax,
          effectiveFrom: input.effectiveFrom.slice(0, 10),
        },
      },
    },
  )
  return mapCommodity(payload.data)
}

export async function fetchVendors(): Promise<{
  vendors: Vendor[]
  owners: VendorUser[]
}> {
  const rows = await apiFetchAll<StrapiVendor>('/vendors', {
    auth: false,
    query: {
      'populate[branch]': 'true',
      'populate[owner]': 'true',
      'populate[paymentQr]': 'true',
      'sort[0]': 'name:asc',
    },
  })
  const vendors = rows.map(mapVendor)
  const ownersById = new Map<string, VendorUser>()
  for (const row of rows) {
    const owner = row.owner
    if (owner && typeof owner === 'object' && 'documentId' in owner && owner.documentId) {
      ownersById.set(owner.documentId, mapVendorUser(owner as StrapiUser))
    }
  }
  return { vendors, owners: [...ownersById.values()] }
}

export async function createVendor(input: VendorCreateInput): Promise<Vendor> {
  const payload = await apiRequest<{ data: StrapiVendor }>('/vendors', {
    method: 'POST',
    body: {
      data: {
        name: input.name.trim(),
        description: input.description.trim(),
        location: input.location.trim(),
        branch: input.branchId,
        categories: input.categories,
        imageUrl: input.imageUrl.trim(),
        isAvailable: input.isAvailable,
        opensAt: input.opensAt,
        cutoffTime: input.cutoffTime,
        demoQrLabel: input.qrLabel.trim(),
        rating: input.rating,
        ...(input.ownerUserId ? { owner: input.ownerUserId } : {}),
      },
    },
    query: {
      'populate[branch]': 'true',
      'populate[owner]': 'true',
      'populate[paymentQr]': 'true',
    },
  })
  return mapVendor(payload.data)
}

export async function updateVendor(
  vendorId: string,
  input: VendorUpdateInput | VendorProfileInput,
): Promise<Vendor> {
  const data: Record<string, unknown> = {}
  if ('name' in input && input.name !== undefined) data.name = input.name.trim()
  if ('description' in input && input.description !== undefined) {
    data.description = input.description.trim()
  }
  if ('location' in input && input.location !== undefined) {
    data.location = input.location.trim()
  }
  if ('isAvailable' in input && input.isAvailable !== undefined) {
    data.isAvailable = input.isAvailable
  }
  if ('opensAt' in input && input.opensAt !== undefined) data.opensAt = input.opensAt
  if ('cutoffTime' in input && input.cutoffTime !== undefined) {
    data.cutoffTime = input.cutoffTime
  }
  if ('rating' in input && input.rating !== undefined) data.rating = input.rating
  if ('branchId' in input && input.branchId !== undefined) data.branch = input.branchId
  if ('ownerUserId' in input && input.ownerUserId !== undefined) {
    data.owner = input.ownerUserId
  }

  const payload = await apiRequest<{ data: StrapiVendor }>(`/vendors/${vendorId}`, {
    method: 'PUT',
    body: { data },
    query: {
      'populate[branch]': 'true',
      'populate[owner]': 'true',
      'populate[paymentQr]': 'true',
    },
  })
  return mapVendor(payload.data)
}

/** Uploads one PNG/JPEG/WebP (≤ 5 MB) as the store's payment QR. Vendor JWT must own the store. */
export async function uploadVendorPaymentQr(
  vendorId: string,
  file: File,
): Promise<{ vendorId: string; paymentQrUrl: string }> {
  const formData = new FormData()
  formData.append('files', file)
  const payload = await apiUpload<{
    data: {
      vendorDocumentId?: string
      paymentQr?: StrapiMedia | null
    }
  }>(`/vendors/${vendorId}/payment-qr`, formData)
  const url = resolveMediaUrl(payload.data?.paymentQr?.url)
  if (!url) {
    throw new ApiError('Upload succeeded but no QR image URL was returned.', 502)
  }
  return {
    vendorId: payload.data.vendorDocumentId ?? vendorId,
    paymentQrUrl: url,
  }
}


export async function fetchProducts(): Promise<Product[]> {
  const rows = await apiFetchAll<StrapiProduct>('/products', {
    auth: false,
    query: {
      'populate[vendor]': 'true',
      'populate[commodity]': 'true',
      'sort[0]': 'name:asc',
    },
  })
  return rows.map(mapProduct)
}

export async function createProduct(
  vendorId: string,
  input: ProductFormInput,
): Promise<Product> {
  const payload = await apiRequest<{ data: StrapiProduct }>('/products', {
    method: 'POST',
    body: {
      data: {
        vendor: vendorId,
        commodity: input.commodityId,
        name: input.name.trim(),
        description: input.description.trim(),
        category: input.category,
        unit: input.unit,
        vendorPrice: input.vendorPrice,
        weightKg: input.weightKg,
        stock: input.stock,
        imageUrl: input.imageUrl.trim(),
        isAvailable: input.isAvailable,
        isArchived: false,
      },
    },
    query: {
      'populate[vendor]': 'true',
      'populate[commodity]': 'true',
    },
  })
  return mapProduct(payload.data)
}

export async function updateProduct(
  productId: string,
  input: Partial<Omit<ProductFormInput, 'commodityId'>> & {
    commodityId?: string
    isArchived?: boolean
    isAvailable?: boolean
  },
): Promise<Product> {
  const data: Record<string, unknown> = {}
  if (input.commodityId !== undefined) data.commodity = input.commodityId
  if (input.name !== undefined) data.name = input.name.trim()
  if (input.description !== undefined) data.description = input.description.trim()
  if (input.category !== undefined) data.category = input.category
  if (input.unit !== undefined) data.unit = input.unit
  if (input.vendorPrice !== undefined) data.vendorPrice = input.vendorPrice
  if (input.weightKg !== undefined) data.weightKg = input.weightKg
  if (input.stock !== undefined) data.stock = input.stock
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl.trim()
  if (input.isAvailable !== undefined) data.isAvailable = input.isAvailable
  if (input.isArchived !== undefined) data.isArchived = input.isArchived

  const payload = await apiRequest<{ data: StrapiProduct }>(`/products/${productId}`, {
    method: 'PUT',
    body: { data },
    query: {
      'populate[vendor]': 'true',
      'populate[commodity]': 'true',
    },
  })
  return mapProduct(payload.data)
}

export async function createVendorAccount(input: {
  name: string
  email: string
  phone: string
  password: string
  vendorIds: string[]
}): Promise<VendorUser> {
  const payload = await apiRequest<{
    data: {
      documentId: string
      username?: string
      name?: string
      email?: string
      phone?: string
      vendorIds?: string[]
    }
  }>('/lgu/vendor-accounts', {
    method: 'POST',
    body: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      password: input.password,
      vendorIds: input.vendorIds,
    },
  })
  return {
    id: payload.data.documentId,
    name: payload.data.name ?? input.name,
    email: payload.data.email ?? input.email,
    phone: payload.data.phone ?? input.phone,
    password: '',
    isActive: true,
  }
}
