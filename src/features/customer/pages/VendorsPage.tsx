import { Store } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { VendorCard } from '@/components/shared/VendorCard'
import { useVendorStore } from '@/stores/vendor-store'

export default function VendorsPage() {
  const vendors = useVendorStore((s) => s.vendors)
  const listed = [...vendors]
    .filter((v) => v.isAvailable)
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))

  return (
    <>
      <PageHeader
        width="wide"
        eyebrow="Marketplace"
        title="All Vendors"
        description={`${listed.length} available ${listed.length === 1 ? 'stall' : 'stalls'} — sorted by rating.`}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {listed.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No vendors available"
            description="Check back later for open stalls."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listed.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
