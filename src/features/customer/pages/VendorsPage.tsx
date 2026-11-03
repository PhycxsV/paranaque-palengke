import { Store } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { VendorCard } from '@/components/shared/VendorCard'
import { useVendorStore } from '@/stores/vendor-store'

export default function VendorsPage() {
  const vendors = useVendorStore((s) => s.vendors)
  const listed = [...vendors]
    .filter((v) => v.isAvailable)
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-primary-deep sm:text-3xl">
          All Vendors
        </h1>
        <p className="mt-2 text-sm text-muted">
          Browse every available stall — sorted by rating
        </p>
      </div>

      {listed.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No vendors available"
          description="Check back later for open stalls."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listed.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  )
}
