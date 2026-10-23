import { Link } from 'react-router-dom'
import { ChevronRight, MapPin, Store } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useVendorStore } from '@/stores/vendor-store'

export default function AdminVendorsPage() {
  const vendors = useVendorStore((s) => s.vendors)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-deep">
          Vendor Directory
        </h1>
        <p className="mt-1 text-sm text-muted">
          All registered marketplace vendors
        </p>
      </div>

      {vendors.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No vendors"
          description="No vendors are registered in the demo yet."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Link key={vendor.id} to={`/admin/vendors/${vendor.id}`}>
              <Card className="group transition hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base">
                          {vendor.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {vendor.location}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-xs text-muted line-clamp-2">
                    {vendor.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={vendor.isAvailable ? 'success' : 'muted'}>
                      {vendor.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                    {vendor.categories.slice(0, 3).map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                    {vendor.categories.length > 3 && (
                      <Badge variant="outline">
                        +{vendor.categories.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
