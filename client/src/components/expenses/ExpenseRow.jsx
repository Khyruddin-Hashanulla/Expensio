import { Users } from 'lucide-react'
import { cn, formatDate, formatCurrency, CATEGORY_LABELS } from '../../lib/format.js'
import { ExpenseBadge } from './ExpenseBadge.jsx'
import { AmountCell } from './AmountCell.jsx'
import { ActionButtons } from './ActionButtons.jsx'
import { EXPENSE_GRID, EXPENSE_ORDER } from './grid.js'

// A single expense rendered as:
//  - a clean, scannable card on mobile (<lg): Title+Amount on the top
//    row, Meta+Actions on the bottom row (Meta left, Actions right).
//  - one row in a fixed-width CSS Grid at lg+ (every column is constant,
//    so no content — long titles, missing Group badge, varying amounts —
//    can ever shift another row's alignment).
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
        'flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3',
        'transition-[background-color,box-shadow] duration-200',
        'hover:bg-secondary hover:shadow-md',
        'lg:grid lg:h-[72px] lg:gap-y-0 lg:px-5 lg:py-0',
        EXPENSE_GRID,
      )}
    >
      {/* Mobile: Title + Amount on one line. Desktop: flattened into the grid. */}
      <div className="flex items-center justify-between gap-3 lg:contents">
        <p className="min-w-0 flex-1 truncate text-base font-semibold text-foreground lg:order-1 lg:min-w-0 lg:flex-none">
          {t.description}
        </p>
        <AmountCell
          amount={amount}
          type={t.type}
          className={cn('shrink-0 text-right', EXPENSE_ORDER.amount)}
        />
      </div>

      {/* Mobile: Meta (left) + Actions (right). Desktop: both flattened. */}
      <div className="flex items-center justify-between gap-3 lg:contents">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 lg:contents">
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
            <span className={cn('hidden w-full lg:block', EXPENSE_ORDER.group)} aria-hidden="true" />
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

        <ActionButtons
          canEdit={!isGroup}
          onEdit={() => onEdit?.(t)}
          onDelete={() => onDelete?.(t._id)}
          editLabel={editLabel}
          deleteLabel={deleteLabel}
          className={cn('shrink-0 lg:self-center', EXPENSE_ORDER.actions)}
        />
      </div>
    </li>
  )
}
