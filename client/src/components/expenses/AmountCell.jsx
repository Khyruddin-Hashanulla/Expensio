import { cn, formatCurrency } from '../../lib/format.js'
import { useCurrency } from '../../context/CurrencyContext.jsx'

// Right-aligned monetary value. Uses tabular figures so every amount lines up
// vertically regardless of length or sign.
export function AmountCell({ amount, type = 'expense', currency: explicitCurrency, className }) {
  const { currency: ctxCurrency } = useCurrency()
  const currency = explicitCurrency || ctxCurrency
  const sign = type === 'income' ? '+' : '-'
  const color = type === 'income' ? 'text-positive' : 'text-foreground'
  return (
    <span
      className={cn(
        'block w-auto whitespace-nowrap text-right text-base font-bold tabular-nums',
        color,
        className,
      )}
    >
      {sign}
      {formatCurrency(amount, currency)}
    </span>
  )
}
