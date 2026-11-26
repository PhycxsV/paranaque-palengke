import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useChatLiveSync } from '@/hooks/useChatLiveSync'
import { useOrdersLiveSync } from '@/hooks/useOrdersLiveSync'
import { useOrderStore } from '@/stores/order-store'
import type { Order } from '@/types'
import { CustomerBottomNav } from './CustomerBottomNav'
import { CustomerFooter } from './CustomerFooter'
import { CustomerHeader } from './CustomerHeader'

export function CustomerLayout() {
  const navigate = useNavigate()
  const orders = useOrderStore((s) => s.orders)
  useChatLiveSync({ intervalMs: 5_000 })
  useOrdersLiveSync({ intervalMs: 5_000 })

  const prevStatusRef = useRef<Map<string, Order['status']>>(new Map())
  const promptedIdsRef = useRef<Set<string>>(new Set())
  const [rejectedOrder, setRejectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    const prev = prevStatusRef.current
    for (const order of orders) {
      const priorStatus = prev.get(order.id)
      // Prompt when an order transitions into payment_rejected while the customer is active.
      if (
        order.status === 'payment_rejected' &&
        priorStatus &&
        priorStatus !== 'payment_rejected' &&
        !promptedIdsRef.current.has(order.id)
      ) {
        promptedIdsRef.current.add(order.id)
        setRejectedOrder(order)
        toast.error(`${order.vendorName} rejected your payment.`)
      }
      prev.set(order.id, order.status)
    }
  }, [orders])

  return (
    <div className="flex min-h-screen flex-col max-md:pb-24">
      <CustomerHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <CustomerFooter />
      <CustomerBottomNav />

      <AlertDialog
        open={Boolean(rejectedOrder)}
        onOpenChange={(open) => {
          if (!open) setRejectedOrder(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Payment rejected by vendor</AlertDialogTitle>
            <AlertDialogDescription>
              {rejectedOrder
                ? `${rejectedOrder.vendorName} has rejected your payment for order ${rejectedOrder.id}. Please check your payment details and resubmit.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Dismiss</AlertDialogCancel>
            {rejectedOrder ? (
              <AlertDialogAction
                onClick={() => {
                  const id = rejectedOrder.id
                  setRejectedOrder(null)
                  navigate(`/customer/payment/${id}`)
                }}
              >
                Resubmit payment
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
