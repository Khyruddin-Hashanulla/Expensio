import { Users } from 'lucide-react'
import { cn, formatDate, formatCurrency, CATEGORY_LABELS } from '../../lib/format.js'
import { ExpenseBadge } from './ExpenseBadge.jsx'
import { AmountCell } from './AmountCell.jsx'
import { ActionButtons } from './ActionButtons.jsx'
import { EXPENSE_GRID, EXPENSE_ORDER } from './grid.js'

// A single expense rendered as:
//  - a stacked, scannable card on mobile (<md)
//  - one row in a fixed-width CSS Grid at md+ (every column is constant,
//    so no content — long titles, missing Group badge, varying amounts — can
//    ever shift another row's alignment)
export function ExpenseRow({ expense, currentUserId, onEdit, onDelete }) {
  const t = expense
  const isGroup = Boolean(t.groupId)
  const mySplit = isGroup
    ? t.splitBetween?.find(
        (s) => String(s.userId?._id ?? s.userId) === String(currentUserId),
      )
    : null
  const amount = mySplit ? mySplit.amountOwed : t.amount
  const categoryLabel = CATEGORY_LABELS[t.category] ?? t.category
  const dateLabel = formatDate(t.date)
  const editLabel = `Edit ${t.description}`
  const deleteLabel = `Delete ${t.description}`

  return (
    <li
      role="listitem"
      aria-label={`${t.description}, ${categoryLabel}, ${
        t.period === 'yearly' ? 'Yearly' : 'Monthly'
      }${isGroup ? ', group expense' : ''}, ${dateLabel}, ${
        t.type === 'income' ? '+' : '-'
      }${formatCurrency(amount)}`}
      className={cn(
        'flex flex-col gap-2 rounded-2xl border border-border bg-card px-4 py-3',
        'transition-[background-color,box-shadow] duration-200',
        'hover:bg-secondary hover:shadow-md',
        'md:grid md:h-[72px] md:gap-y-0 md:px-5 md:py-0',
        EXPENSE_GRID,
      )}
    >
      {/* Mobile: Title + Amount on one line. Desktop: flattened into the grid. */}
      <div className="flex items-center justify-between gap-3 md:contents">
        <p className="min-w-0 flex-1 truncate text-base font-semibold text-foreground md:order-1 md:min-w-0 md:flex-none">
          {t.description}
        </p>
        <AmountCell
          amount={amount}
          type={t.type}
          className={cn('shrink-0 text-right', EXPENSE_ORDER.amount)}
        />
      </div>

      {/* Metadata: Category · Frequency · Group · Date */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 md:contents">
        <span
          className={cn(
            'w-auto truncate text-[13px] text-muted-foreground',
            EXPENSE_ORDER.category,
          )}
        >
          {categoryLabel}
        </span>
        <ExpenseBadge
          variant={t.period === 'yearly' ? 'warning' : 'default'}
          className={EXPENSE_ORDER.frequency}
        >
          {t.period === 'yearly' ? 'Yearly' : 'Monthly'}
        </ExpenseBadge>
        {isGroup ? (
          <ExpenseBadge variant="primary" icon={Users} className={EXPENSE_ORDER.group}>
            Group
          </ExpenseBadge>
        ) : (
          <span className={cn('hidden w-full md:block', EXPENSE_ORDER.group)} aria-hidden="true" />
        )}
        <span
          className={cn(
            'w-auto text-[13px] text-muted-foreground',
            EXPENSE_ORDER.date,
          )}
        >
          {dateLabel}
        </span>
      </div>

      {/* Actions: always the same column width. */}
      <ActionButtons
        canEdit={!isGroup}
        onEdit={() => onEdit?.(t)}
        onDelete={() => onDelete?.(t._id)}
        editLabel={editLabel}
        deleteLabel={deleteLabel}
        className={cn('mt-1 self-end md:mt-0 md:self-center', EXPENSE_ORDER.actions)}
      />
    </li>
  )
}
