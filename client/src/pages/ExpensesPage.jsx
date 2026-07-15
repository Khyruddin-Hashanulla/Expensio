import { useState } from 'react'
import { Plus, Receipt, Pencil, Trash2, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { useTransactions, useTransactionMutations } from '../hooks/useData.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Modal,
  Spinner,
  EmptyState,
  Badge,
  ErrorMessage,
} from '../components/ui.jsx'
import { formatCurrency, formatDate, CATEGORIES, CATEGORY_LABELS } from '../lib/format.js'

const EMPTY_FORM = {
  type: 'expense',
  amount: '',
  description: '',
  category: 'food',
  period: 'monthly',
  date: new Date().toISOString().slice(0, 10),
}

function TransactionForm({ initial, onSubmit, submitting, error }) {
  const [form, setForm] = useState(initial)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="txn-type">Type</Label>
          <Select id="txn-type" value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="txn-amount">Amount</Label>
          <Input
            id="txn-amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="txn-desc">Description</Label>
        <Input
          id="txn-desc"
          required
          maxLength={500}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="What Was This For?"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="txn-category">Category</Label>
          <Select
            id="txn-category"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="txn-period">Period</Label>
          <Select
            id="txn-period"
            value={form.period}
            onChange={(e) => set('period', e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="txn-date">Date</Label>
          <Input
            id="txn-date"
            type="date"
            required
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
          />
        </div>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      <Button type="submit" loading={submitting}>
        Save transaction
      </Button>
    </form>
  )
}

export default function ExpensesPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ type: '', category: '' })
  const [modal, setModal] = useState(null) // null | 'create' | transaction object
  const [error, setError] = useState('')
  const { toast } = useToast()

  const { user } = useAuth()

  const params = {
    page,
    limit: 10,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.category ? { category: filters.category } : {}),
  }
  const { data, isLoading } = useTransactions(params)
  const { create, update, remove } = useTransactionMutations()

  async function handleSubmit(form) {
    setError('')
    const body = {
      type: form.type,
      amount: Number(form.amount),
      description: form.description,
      category: form.category,
      period: form.period,
      date: form.date,
    }
    try {
      if (modal === 'create') {
        await create.mutateAsync(body)
        toast({ title: 'Transaction Added', variant: 'success' })
      } else {
        await update.mutateAsync({ id: modal._id, ...body })
        toast({ title: 'Transaction Updated', variant: 'success' })
      }
      setModal(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Something Went Wrong.')
    }
  }

  async function handleDelete(id) {
    try {
      await remove.mutateAsync(id)
      toast({ title: 'Transaction Deleted', variant: 'success' })
    } catch (err) {
      toast({
        title: 'Delete Failed',
        description: err.response?.data?.message,
        variant: 'error',
      })
    }
  }

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">Your Personal Income And Spending</p>
        </div>
        <Button onClick={() => setModal('create')}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add transaction
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Label htmlFor="filter-type">Type</Label>
          <Select
            id="filter-type"
            value={filters.type}
            onChange={(e) => {
              setPage(1)
              setFilters((f) => ({ ...f, type: e.target.value }))
            }}
          >
            <option value="">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
        </div>
        <div className="w-44">
          <Label htmlFor="filter-category">Category</Label>
          <Select
            id="filter-category"
            value={filters.category}
            onChange={(e) => {
              setPage(1)
              setFilters((f) => ({ ...f, category: e.target.value }))
            }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Transactions Found"
          description="Add A Transaction Or Adjust Your Filters."
          action={
            <Button size="sm" variant="outline" onClick={() => setModal('create')}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add transaction
            </Button>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {items.map((t) => {
              const isGroup = Boolean(t.groupId)
              const currentUserId = String(user?._id ?? user?.id)
              const mySplit = isGroup
                ? t.splitBetween?.find(
                    (s) => String(s.userId?._id ?? s.userId) === currentUserId,
                  )
                : null
              const displayAmount = mySplit ? mySplit.amountOwed : t.amount
              return (
                <li key={t._id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{t.description}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge className="w-auto truncate justify-center sm:w-28 sm:shrink-0">
                        {CATEGORY_LABELS[t.category] ?? t.category}
                      </Badge>
                      <Badge
                        variant={t.period === 'yearly' ? 'warning' : 'default'}
                        className="w-auto justify-center sm:w-[4.5rem] sm:shrink-0"
                      >
                        {t.period === 'yearly' ? 'Yearly' : 'Monthly'}
                      </Badge>
                      {isGroup ? (
                        <Badge
                          variant="primary"
                          className="w-auto justify-center sm:w-[4.5rem] sm:shrink-0"
                        >
                          <Users className="mr-1 h-3 w-3" aria-hidden="true" />
                          Group
                        </Badge>
                      ) : null}
                      <span className="w-auto text-xs text-muted-foreground sm:w-24 sm:shrink-0">
                        {formatDate(t.date)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={
                        t.type === 'income'
                          ? 'w-auto whitespace-nowrap text-sm font-semibold text-emerald-400 tabular-nums sm:w-[5.5rem] sm:shrink-0 sm:text-right'
                          : 'w-auto whitespace-nowrap text-sm font-semibold text-foreground tabular-nums sm:w-[5.5rem] sm:shrink-0 sm:text-right'
                      }
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(displayAmount)}
                    </span>
                    <div className="flex w-auto shrink-0 justify-end gap-1 sm:w-20">
                      {!isGroup ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setModal({
                                ...t,
                                date: t.date?.slice(0, 10),
                                amount: String(t.amount),
                              })
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="sr-only">{`Edit ${t.description}`}</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(t._id)}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="sr-only">{`Delete ${t.description}`}</span>
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      <Modal
        open={modal !== null}
        onClose={() => {
          setModal(null)
          setError('')
        }}
        title={modal === 'create' ? 'Add Transaction' : 'Edit Transaction'}
      >
        {modal !== null ? (
          <TransactionForm
            initial={modal === 'create' ? EMPTY_FORM : modal}
            onSubmit={handleSubmit}
            submitting={create.isPending || update.isPending}
            error={error}
          />
        ) : null}
      </Modal>
    </div>
  )
}
