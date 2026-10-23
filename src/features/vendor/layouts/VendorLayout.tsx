import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VendorSidebar } from './VendorSidebar'

export function VendorLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-warm-white lg:grid lg:grid-cols-[260px_1fr]">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <VendorSidebar />
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-[280px] max-w-[85vw]">
            <VendorSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle vendor menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <p className="font-bold text-primary-deep">Vendor portal</p>
        </div>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
