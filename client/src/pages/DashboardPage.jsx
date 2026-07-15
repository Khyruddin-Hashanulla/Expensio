import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Receipt,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { useSummary, useTransactions, useBudgetStatus } from '../hooks/useData.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Card, Badge, Spinner, EmptyState } from '../components/ui.jsx'
import PeriodToggle from '../components/PeriodToggle.jsx'
import { formatCurrency, formatDate, CATEGORY_LABELS } from '../lib/format.js'

const CHART_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6']

export default function DashboardPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const period = searchParams.get('period') || 'monthly'
  const { data: summary, isLoading: summaryLoading } = useSummary(period)
  const { data: txData, isLoading: txLoading } = useTransactions({ limit: 5 })
  const { data: budgetData } = useBudgetStatus(period)

  const totals = useMemo(() => {
    const byDay = summary?.byDay ?? []
    let income = 0
    let expense = 0
    for (const d of byDay) {
      if (d.type === 'income') income += d.total
      else expense += d.total
    }
    return { income, expense, net: income - expense }
  }, [summary])

  const categoryData = useMemo(
    () =>
      (summary?.byCategory ?? []).slice(0, 6).map((c) => ({
        name: CATEGORY_LABELS[c.category] ?? c.category,
        total: Number(c.total.toFixed(2)),
      })),
    [summary],
  )

  const overBudget = (budgetData?.budgets ?? []).filter((b) => b.percentUsed >= 80)

  if (summaryLoading || txLoading) return <Spinner />

  const transactions = txData?.items ?? []

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground text-balance">
            {`Hi ${user?.name?.split(' ')[0] ?? 'there'}, Here's Your ${period === 'yearly' ? 'Year' : 'Month'}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview For{' '}
            {period === 'yearly'
              ? new Date().getFullYear()
              : new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <PeriodToggle
          value={period}
          onChange={(next) => setSearchParams({ period: next })}
        />
      </header>

      {/* Stat cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0.6, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowDownLeft className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span className="text-xs font-medium">Income</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(totals.income)}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowUpRight className="h-4 w-4 text-red-400" aria-hidden="true" />
            <span className="text-xs font-medium">Expenses</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(totals.expense)}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-xs font-medium">Net</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(totals.net)}
          </p>
        </Card>
      </div>
      </motion.div>
      </AnimatePresence>

      {/* Budget alerts */}
      {overBudget.length > 0 ? (
        <Card className="border-amber-500/30 p-4">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Budget Alerts</p>
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {overBudget.map((b) => (
              <li key={b._id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <span className="text-muted-foreground">
                    {CATEGORY_LABELS[b.category] ?? b.category}
                  </span>
                  {b.percentUsed < 100 && b.daysRemaining > 0 ? (
                    <p className="mt-0.5 text-[10px] text-amber-400">
                      {formatCurrency(b.dailyBudget)} / day for {b.daysRemaining} day{b.daysRemaining !== 1 ? 's' : ''}
                    </p>
                  ) : b.percentUsed >= 100 ? (
                    <p className="mt-0.5 text-[10px] text-red-400">
                      {formatCurrency(Math.abs(b.effectiveLimit - b.currentSpend))} over limit
                    </p>
                  ) : null}
                </div>
                <Badge variant={b.percentUsed >= 100 ? 'danger' : 'warning'} className="shrink-0">
                  {`${Math.round(b.percentUsed)}%`}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* Spending by category */}
      <Card className="p-4">
        <h2 className="mb-4 text-sm font-medium text-foreground">Spending By Category</h2>
        {categoryData.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={period === 'yearly' ? 'No Expenses This Year' : 'No Expenses This Month'}
            description="Add Your First Expense To See Your Spending Breakdown."
          />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
                        <p className="text-xs font-medium text-foreground">{label}</p>
                        <p className="text-sm font-semibold text-primary">{formatCurrency(payload[0].value)}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={18}>
                  {categoryData.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Recent transactions */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Recent Transactions</h2>
          <Link to="/expenses" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No Transactions Yet"
            description="Head To Expenses To Record Your First One."
          />
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((t) => {
              const isGroup = Boolean(t.groupId)
              const currentUserId = String(user?._id ?? user?.id)
              const mySplit = isGroup
                ? t.splitBetween?.find(
                    (s) => String(s.userId?._id ?? s.userId) === currentUserId,
                  )
                : null
              const displayAmount = mySplit ? mySplit.amountOwed : t.amount
              return (
                <li key={t._id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {isGroup ? (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Users className="h-3 w-3" aria-hidden="true" />
                          Group ·{' '}
                        </span>
                      ) : null}
                      {CATEGORY_LABELS[t.category] ?? t.category} · {formatDate(t.date)}
                    </p>
                  </div>
                  <span
                    className={
                      t.type === 'income'
                        ? 'text-sm font-semibold text-emerald-400'
                        : 'text-sm font-semibold text-foreground'
                    }
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(displayAmount)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
