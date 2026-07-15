import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, PiggyBank, Trash2 } from 'lucide-react'
import { useBudgetStatus, useBudgetMutations } from '../hooks/useData.js'
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
import PeriodToggle from '../components/PeriodToggle.jsx'
import { formatCurrency, CATEGORIES, CATEGORY_LABELS } from '../lib/format.js'

function ProgressBar({ percent }) {
  const clamped = Math.min(percent, 100)
  const color =
    percent >= 100 ? 'bg-red-500' : percent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-secondary"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export default function BudgetsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const period = searchParams.get('period') || 'monthly'
  const { data, isLoading } = useBudgetStatus(period)
  const { create, remove } = useBudgetMutations()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ category: 'food', period: 'monthly', monthlyLimit: '' })
  const [error, setError] = useState('')

  const budgets = data?.budgets ?? []
  const usedCategories = new Set(budgets.map((b) => b.category))
  const available = CATEGORIES.filter((c) => !usedCategories.has(c))

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await create.mutateAsync({
        category: form.category,
        period: form.period,
        monthlyLimit: Number(form.monthlyLimit),
      })
      toast({ title: 'Budget Created', variant: 'success' })
      setOpen(false)
      setForm({ category: available[1] ?? 'food', period: 'monthly', monthlyLimit: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable To Create Budget.')
    }
  }

  async function handleDelete(id) {
    try {
      await remove.mutateAsync(id)
      toast({ title: 'Budget Deleted', variant: 'success' })
    } catch (err) {
      toast({ title: 'Delete Failed', description: err.response?.data?.message, variant: 'error' })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            {period === 'yearly'
              ? `Yearly Spending Vs. Limits For ${new Date().getFullYear()}`
              : `Monthly Spending Limits For ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodToggle value={period} onChange={(next) => setSearchParams({ period: next })} />
          <Button onClick={() => setOpen(true)} disabled={available.length === 0}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add budget
          </Button>
        </div>
      </header>

      {isLoading ? (
        <Spinner />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No Budgets Set"
          description="Create A Monthly Limit Per Category To Keep Spending In Check."
          action={
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add budget
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {budgets.map((b) => (
            <Card key={b._id} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {CATEGORY_LABELS[b.category] ?? b.category}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      b.percentUsed >= 100 ? 'danger' : b.percentUsed >= 80 ? 'warning' : 'success'
                    }
                  >
                    {`${Math.round(b.percentUsed)}%`}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b._id)}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">{`Delete ${b.category} budget`}</span>
                  </Button>
                </div>
              </div>
              <ProgressBar percent={b.percentUsed} />
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(b.currentSpend)} Of {formatCurrency(b.effectiveLimit ?? b.monthlyLimit)} Spent
                  {period === 'yearly' ? ' This Year' : ''}
                </p>
                {b.daysRemaining > 0 && b.percentUsed < 100 ? (
                  <p className="text-[10px] text-muted-foreground">
                    {formatCurrency(b.dailyBudget)} / day left
                  </p>
                ) : null}
              </div>
              {b.percentUsed >= 80 && b.percentUsed < 100 ? (
                <p className="mt-1 text-[10px] text-amber-400">
                  ⚠️ {b.daysRemaining} day{b.daysRemaining !== 1 ? 's' : ''} remaining — {formatCurrency(b.dailyBudget)} / day to stay within budget
                </p>
              ) : b.percentUsed >= 100 ? (
                <p className="mt-1 text-[10px] text-red-400">
                  🚫 Budget exceeded — {formatCurrency(Math.abs(b.effectiveLimit - b.currentSpend))} over limit
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Budget">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="budget-category">Category</Label>
            <Select
              id="budget-category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {available.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="budget-period">Period</Label>
            <Select
              id="budget-period"
              value={form.period}
              onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="budget-limit">Monthly Limit</Label>
            <Input
              id="budget-limit"
              type="number"
              step="0.01"
              min="1"
              required
              value={form.monthlyLimit}
              onChange={(e) => setForm((f) => ({ ...f, monthlyLimit: e.target.value }))}
              placeholder="500.00"
            />
            <ErrorMessage>{error}</ErrorMessage>
          </div>
          <Button type="submit" loading={create.isPending}>
            Create budget
          </Button>
        </form>
      </Modal>
    </div>
  )
}
