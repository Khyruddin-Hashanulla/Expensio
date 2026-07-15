import { cn } from '../../lib/format.js'

const VARIANTS = {
  default: 'bg-secondary text-secondary-foreground',
  warning: 'bg-amber-500/15 text-amber-400',
  primary: 'bg-primary/15 text-primary',
}

// Pill badge used for Frequency and Group cells. Fills its (fixed-width) grid
// column so Monthly/Yearly and Group/empty always occupy identical space.
export function ExpenseBadge({ variant = 'default', icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex w-auto items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium whitespace-nowrap md:w-full',
        VARIANTS[variant],
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
