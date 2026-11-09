import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-tight transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-deep hover:shadow-md',
        secondary:
          'border border-primary/15 bg-primary-50 text-primary-deep hover:bg-primary-100',
        outline:
          'border border-primary/20 bg-surface text-primary-deep hover:border-primary/40 hover:bg-primary-50',
        ghost: 'text-ink hover:bg-primary-50',
        gold: 'bg-gold text-primary-deep shadow-sm hover:brightness-95',
        lime: 'bg-lime text-primary-deep shadow-sm hover:brightness-95',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-12 rounded-xl px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
