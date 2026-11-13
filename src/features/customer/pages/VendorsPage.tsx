import { useMemo, useState } from 'react'
import { MapPin, Store, X } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { VendorCard } from '@/components/shared/VendorCard'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBranchStore } from '@/stores/branch-store'
import { useVendorStore } from '@/stores/vendor-store'

export default function VendorsPage() {
  const vendors = useVendorStore((s) => s.vendors)
  const branches = useBranchStore((s) => s.branches)
  const [branchId, setBranchId] = useState('all')

  const activeBranches = useMemo(
    () => branches.filter((b) => b.isActive),
    [branches],
  )

  const listed = useMemo(() => {
    return [...vendors]
      .filter((v) => v.isAvailable)
      .filter((v) => branchId === 'all' || v.branchId === branchId)
      .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))
  }, [vendors, branchId])

  const availableCount = vendors.filter((v) => v.isAvailable).length

  return (
    <>
      <PageHeader
        width="wide"
        eyebrow="Marketplace"
        title="All Vendors"
        description={
          branchId === 'all'
            ? `${listed.length} available ${listed.length === 1 ? 'stall' : 'stalls'} — sorted by rating.`
            : `${listed.length} of ${availableCount} available ${listed.length === 1 ? 'stall' : 'stalls'} in this palengke.`
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger
              className="w-full sm:w-64"
              aria-label="Filter by palengke"
            >
              <SelectValue placeholder="All palengkes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All palengkes</SelectItem>
              {activeBranches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {branchId !== 'all' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBranchId('all')}
              className="gap-1.5"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>

        {availableCount === 0 ? (
          <EmptyState
            icon={Store}
            title="No vendors available"
            description="Check back later for open stalls."
          />
        ) : listed.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No stalls in this palengke"
            description="Try another market or clear the filter."
            actionLabel="Clear filter"
            onAction={() => setBranchId('all')}
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
