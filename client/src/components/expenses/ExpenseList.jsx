import { cn } from '../../lib/format.js'
import { ExpenseRow } from './ExpenseRow.jsx'
import { EXPENSE_GRID, EXPENSE_ORDER } from './grid.js'

const COLUMNS = [
  { key: 'title', label: 'Title', className: EXPENSE_ORDER.title },
  { key: 'category', label: 'Category', className: EXPENSE_ORDER.category },
  { key: 'frequency', label: 'Frequency', className: EXPENSE_ORDER.frequency },
  { key: 'group', label: 'Group', className: EXPENSE_ORDER.group },
  { key: 'date', label: 'Date', className: EXPENSE_ORDER.date },
  {
    key: 'amount',
    label: 'Amount',
    className: cn('text-right', EXPENSE_ORDER.amount),
  },
  { key: 'actions', label: '', className: EXPENSE_ORDER.actions },
]

export function ExpenseList({ items, currentUserId, onEdit, onDelete }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn('hidden px-5 py-3 lg:grid', EXPENSE_GRID)}>
        {COLUMNS.map((c) => (
          <span
            key={c.key}
            className={cn(
              'text-[11px] font-medium uppercase tracking-wider text-muted-foreground',
              c.className,
            )}
          >
            {c.label}
          </span>
        ))}
      </div>

      <ul role="list" className="flex flex-col gap-2">
        {items.map((t) => (
          <ExpenseRow
            key={t._id}
            expense={t}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  )
}
