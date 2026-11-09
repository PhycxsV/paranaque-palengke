import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

export function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'dialog-overlay fixed inset-0 z-50 bg-primary-deep/55 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'dialog-content fixed left-1/2 top-1/2 z-50 flex max-h-[min(92vh,880px)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-surface p-0 shadow-[var(--shadow-lift)]',
          className,
        )}
        {...props}
      >
        <span
          className="brand-ribbon absolute inset-x-0 top-0 z-10 h-1.5 rounded-t-2xl"
          aria-hidden
        />
        {children}
        <DialogPrimitive.Close className="absolute right-3.5 top-3.5 z-20 rounded-full p-1.5 text-muted transition hover:bg-primary-50 hover:text-primary-deep">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'shrink-0 space-y-1.5 border-b border-border bg-surface px-6 pb-4 pt-7 pr-12 text-left',
        className,
      )}
      {...props}
    />
  )
}

/** Scrollable middle section — keeps the header and footer pinned. */
export function DialogBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'dialog-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain',
        className,
      )}
      {...props}
    >
      {/* Inner pad keeps the scrollbar flush to the modal edge */}
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'shrink-0 border-t border-border bg-warm-white/90 px-6 py-4 backdrop-blur-sm',
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        'font-display text-xl font-bold tracking-tight text-primary-deep',
        className,
      )}
      {...props}
    />
  )
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted', className)}
      {...props}
    />
  )
}
