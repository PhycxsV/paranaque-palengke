import { Outlet } from 'react-router-dom'
import { CustomerBottomNav } from './CustomerBottomNav'
import { CustomerFooter } from './CustomerFooter'
import { CustomerHeader } from './CustomerHeader'

export function CustomerLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <CustomerHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <CustomerFooter />
      <CustomerBottomNav />
    </div>
  )
}
