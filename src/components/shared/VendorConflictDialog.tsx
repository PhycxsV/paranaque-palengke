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

interface VendorConflictDialogProps {
  open: boolean
  currentVendorName: string
  newVendorName: string
  onKeep: () => void
  onReplace: () => void
}

export function VendorConflictDialog({
  open,
  currentVendorName,
  newVendorName,
  onKeep,
  onReplace,
}: VendorConflictDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onKeep()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>One vendor per checkout</AlertDialogTitle>
          <AlertDialogDescription>
            Your cart currently has items from <strong>{currentVendorName}</strong>.
            Adding products from <strong>{newVendorName}</strong> will clear the
            existing cart. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onKeep}>Keep current cart</AlertDialogCancel>
          <AlertDialogAction onClick={onReplace}>
            Clear cart & shop new vendor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
