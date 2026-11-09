import { Outlet } from 'react-router-dom'
import { CustomerBottomNav } from './CustomerBottomNav'
import { CustomerFooter } from './CustomerFooter'
import { CustomerHeader } from './CustomerHeader'

export function CustomerLayout() {
  return (
    <div className="flex min-h-screen flex-col max-md:pb-24">
      <CustomerHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <CustomerFooter />
      <CustomerBottomNav />
    </div>
  )
}
