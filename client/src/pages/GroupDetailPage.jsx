import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import {
  ArrowLeft,
  Plus,
  UserPlus,
  Receipt,
  ArrowRight,
  Scale,
  Trash2,
  Pencil,
} from 'lucide-react'
import {
  useGroup,
  useGroupBalances,
  useSimplifiedDebts,
  useGroupMutations,
  useTransactions,
  useTransactionMutations,
  useSettlementMutations,
  useRealtimeGroup,
} from '../hooks/useData.js'
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

function memberName(members, userId) {
  const m = members?.find((mem) => String(mem.userId?._id ?? mem.userId) === String(userId))
  return m?.userId?.name ?? 'Unknown'
}

function SplitExpenseForm({ group, onDone }) {
  const { create } = useTransactionMutations()
  const { toast } = useToast()
  const members = group.members ?? []
  const memberIds = members.map((m) => String(m.userId?._id ?? m.userId))

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'food',
    paidBy: memberIds[0] ?? '',
    splitType: 'equal',
  })
  const [selected, setSelected] = useState(new Set(memberIds))
  const [custom, setCustom] = useState({}) // userId -> percentage or share
  const [error, setError] = useState('')

  function toggleMember(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const participantIds = memberIds.filter((id) => selected.has(id))
    if (participantIds.length === 0) {
      setError('Select At Least One Participant.')
      return
    }
    const participants = participantIds.map((userId) => {
      const p = { userId }
      if (form.splitType === 'percentage') p.percentage = Number(custom[userId] ?? 0)
      if (form.splitType === 'custom') p.share = Number(custom[userId] ?? 0)
      return p
    })
    if (form.splitType === 'percentage') {
      const sum = participants.reduce((s, p) => s + p.percentage, 0)
      if (Math.abs(sum - 100) > 0.01) {
        setError(`Percentages must add up to 100 (currently ${sum.toFixed(2)}).`)
        return
      }
    }
    if (form.splitType === 'custom') {
      const sum = participants.reduce((s, p) => s + p.share, 0)
      if (Math.abs(sum - Number(form.amount)) > 0.01) {
        setError(`Shares must add up to ${form.amount} (currently ${sum.toFixed(2)}).`)
        return
      }
    }
    try {
      await create.mutateAsync({
        type: 'expense',
        amount: Number(form.amount),
        description: form.description,
        category: form.category,
        groupId: group._id,
        paidBy: form.paidBy,
        splitType: form.splitType,
        participants,
      })
      toast({ title: 'Expense Added', variant: 'success' })
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable To Add Expense.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="split-desc">Description</Label>
        <Input
          id="split-desc"
          required
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Dinner At The Pier"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="split-amount">Amount</Label>
          <Input
            id="split-amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="split-category">Category</Label>
          <Select
            id="split-category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="split-paidby">Paid By</Label>
          <Select
            id="split-paidby"
            value={form.paidBy}
            onChange={(e) => setForm((f) => ({ ...f, paidBy: e.target.value }))}
          >
            {members.map((m) => {
              const id = String(m.userId?._id ?? m.userId)
              return (
                <option key={id} value={id}>
                  {m.userId?.name ?? 'Member'}
                </option>
              )
            })}
          </Select>
        </div>
        <div>
          <Label htmlFor="split-type">Split Type</Label>
          <Select
            id="split-type"
            value={form.splitType}
            onChange={(e) => setForm((f) => ({ ...f, splitType: e.target.value }))}
          >
            <option value="equal">Equal</option>
            <option value="percentage">Percentage</option>
            <option value="custom">Custom Amounts</option>
          </Select>
        </div>
      </div>

      <fieldset>
        <legend className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Split between
        </legend>
        <div className="flex flex-col gap-2">
          {members.map((m) => {
            const id = String(m.userId?._id ?? m.userId)
            const checked = selected.has(id)
            return (
              <div
                key={id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <input
                  id={`member-${id}`}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMember(id)}
                  className="h-4 w-4 accent-emerald-500"
                />
                <label htmlFor={`member-${id}`} className="flex-1 text-sm text-foreground">
                  {m.userId?.name ?? 'Member'}
                </label>
                {checked && form.splitType !== 'equal' ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-8 w-24"
                    aria-label={
                      form.splitType === 'percentage'
                        ? `Percentage for ${m.userId?.name}`
                        : `Share for ${m.userId?.name}`
                    }
                    placeholder={form.splitType === 'percentage' ? '%' : 'amount'}
                    value={custom[id] ?? ''}
                    onChange={(e) => setCustom((c) => ({ ...c, [id]: e.target.value }))}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </fieldset>

      <ErrorMessage>{error}</ErrorMessage>
      <Button type="submit" loading={create.isPending}>
        Add expense
      </Button>
    </form>
  )
}

function EditExpenseForm({ group, transaction, onDone }) {
  const { update } = useTransactionMutations()
  const { toast } = useToast()
  const members = group.members ?? []
  const memberIds = members.map((m) => String(m.userId?._id ?? m.userId))
  const splitByIds = transaction.splitBetween?.map((s) => String(s.userId?._id ?? s.userId)) ?? memberIds

  const [form, setForm] = useState({
    description: transaction.description ?? '',
    amount: String(transaction.amount ?? ''),
    category: transaction.category ?? 'food',
    paidBy: String(transaction.paidBy?._id ?? transaction.paidBy ?? memberIds[0]),
    splitType: transaction.splitType ?? 'equal',
  })
  const [selected, setSelected] = useState(new Set(splitByIds))
  const [custom, setCustom] = useState(() => {
    const initial = {}
    if (transaction.splitBetween) {
      for (const s of transaction.splitBetween) {
        const id = String(s.userId?._id ?? s.userId)
        if (s.percentage != null) initial[id] = String(s.percentage)
        else if (s.share != null) initial[id] = String(s.share)
      }
    }
    return initial
  })
  const [error, setError] = useState('')

  function toggleMember(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const participantIds = memberIds.filter((id) => selected.has(id))
    if (participantIds.length === 0) {
      setError('Select At Least One Participant.')
      return
    }
    const participants = participantIds.map((userId) => {
      const p = { userId }
      if (form.splitType === 'percentage') p.percentage = Number(custom[userId] ?? 0)
      if (form.splitType === 'custom') p.share = Number(custom[userId] ?? 0)
      return p
    })
    if (form.splitType === 'percentage') {
      const sum = participants.reduce((s, p) => s + p.percentage, 0)
      if (Math.abs(sum - 100) > 0.01) {
        setError(`Percentages must add up to 100 (currently ${sum.toFixed(2)}).`)
        return
      }
    }
    if (form.splitType === 'custom') {
      const sum = participants.reduce((s, p) => s + p.share, 0)
      if (Math.abs(sum - Number(form.amount)) > 0.01) {
        setError(`Shares must add up to ${form.amount} (currently ${sum.toFixed(2)}).`)
        return
      }
    }
    try {
      await update.mutateAsync({
        id: transaction._id,
        type: 'expense',
        amount: Number(form.amount),
        description: form.description,
        category: form.category,
        groupId: group._id,
        paidBy: form.paidBy,
        splitType: form.splitType,
        participants,
      })
      toast({ title: 'Expense Updated', variant: 'success' })
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable To Update Expense.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="edit-desc">Description</Label>
        <Input
          id="edit-desc"
          required
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="edit-amount">Amount</Label>
          <Input
            id="edit-amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="edit-category">Category</Label>
          <Select
            id="edit-category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="edit-paidby">Paid By</Label>
          <Select
            id="edit-paidby"
            value={form.paidBy}
            onChange={(e) => setForm((f) => ({ ...f, paidBy: e.target.value }))}
          >
            {members.map((m) => {
              const id = String(m.userId?._id ?? m.userId)
              return (
                <option key={id} value={id}>
                  {m.userId?.name ?? 'Member'}
                </option>
              )
            })}
          </Select>
        </div>
        <div>
          <Label htmlFor="edit-split-type">Split Type</Label>
          <Select
            id="edit-split-type"
            value={form.splitType}
            onChange={(e) => setForm((f) => ({ ...f, splitType: e.target.value }))}
          >
            <option value="equal">Equal</option>
            <option value="percentage">Percentage</option>
            <option value="custom">Custom Amounts</option>
          </Select>
        </div>
      </div>

      <fieldset>
        <legend className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Split between
        </legend>
        <div className="flex flex-col gap-2">
          {members.map((m) => {
            const id = String(m.userId?._id ?? m.userId)
            const checked = selected.has(id)
            return (
              <div
                key={id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <input
                  id={`edit-member-${id}`}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMember(id)}
                  className="h-4 w-4 accent-emerald-500"
                />
                <label htmlFor={`edit-member-${id}`} className="flex-1 text-sm text-foreground">
                  {m.userId?.name ?? 'Member'}
                </label>
                {checked && form.splitType !== 'equal' ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-8 w-24"
                    aria-label={
                      form.splitType === 'percentage'
                        ? `Percentage for ${m.userId?.name}`
                        : `Share for ${m.userId?.name}`
                    }
                    placeholder={form.splitType === 'percentage' ? '%' : 'amount'}
                    value={custom[id] ?? ''}
                    onChange={(e) => setCustom((c) => ({ ...c, [id]: e.target.value }))}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </fieldset>

      <ErrorMessage>{error}</ErrorMessage>
      <Button type="submit" loading={update.isPending}>
        Update expense
      </Button>
    </form>
  )
}

export default function GroupDetailPage() {
  const { groupId } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  useRealtimeGroup(groupId)

  const { data: groupData, isLoading: groupLoading } = useGroup(groupId)
  const { data: balanceData } = useGroupBalances(groupId)
  const { data: simplifyData } = useSimplifiedDebts(groupId)
  const { data: txData } = useTransactions({ groupId, limit: 20 })
  const navigate = useNavigate()
  const { addMember, removeMember, remove: deleteGroup } = useGroupMutations()
  const { create: createSettlement } = useSettlementMutations()

  const [expenseOpen, setExpenseOpen] = useState(false)
  const [memberOpen, setMemberOpen] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberError, setMemberError] = useState('')
  const [editTxn, setEditTxn] = useState(null)

  const group = groupData?.group
  const balances = balanceData?.balances ?? []
  const suggestions = simplifyData?.suggestions ?? []
  const transactions = txData?.items ?? []

  const isCreator = useMemo(
    () => String(group?.createdBy) === String(user?._id ?? user?.id),
    [group, user],
  )

  async function handleAddMember(e) {
    e.preventDefault()
    setMemberError('')
    try {
      await addMember.mutateAsync({ groupId, email: memberEmail })
      toast({ title: 'Member Added', variant: 'success' })
      setMemberOpen(false)
      setMemberEmail('')
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Unable To Add Member.')
    }
  }

  async function handleSettle(s) {
    try {
      await createSettlement.mutateAsync({
        groupId,
        fromUser: s.fromUser,
        toUser: s.toUser,
        amount: s.amount,
        idempotencyKey: uuidv4(),
      })
      toast({ title: 'Settlement Recorded', variant: 'success' })
    } catch (err) {
      toast({
        title: 'Settlement Failed',
        description: err.response?.data?.message,
        variant: 'error',
      })
    }
  }

  async function handleDeleteGroup() {
    if (!window.confirm('Delete this group permanently? This action cannot be undone.')) return
    try {
      await deleteGroup.mutateAsync(groupId)
      toast({ title: 'Group Deleted', variant: 'success' })
      navigate('/groups')
    } catch (err) {
      toast({
        title: 'Delete Failed',
        description: err.response?.data?.message,
        variant: 'error',
      })
    }
  }

  async function handleRemoveMember(userId) {
    try {
      await removeMember.mutateAsync({ groupId, userId })
      toast({ title: 'Member Removed', variant: 'success' })
    } catch (err) {
      toast({
        title: 'Remove Failed',
        description: err.response?.data?.message,
        variant: 'error',
      })
    }
  }

  if (groupLoading) return <Spinner />
  if (!group) {
    return (
      <EmptyState
        title="Group Not Found"
        description="It May Have Been Deleted Or You Are Not A Member."
        action={
          <Link to="/groups">
            <Button size="sm" variant="outline">
              Back to groups
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/groups"
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Back To Groups</span>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{group.name}</h1>
            <p className="text-sm text-muted-foreground">
              {group.members?.length ?? 0} members · {group.currency ?? 'USD'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setMemberOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Add member</span>
            <span className="sm:hidden">Member</span>
          </Button>
          {!isCreator ? null : (
            <Button variant="destructive" size="sm" onClick={handleDeleteGroup}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Delete group</span>
              <span className="sm:hidden">Delete</span>
            </Button>
          )}
          <Button size="sm" onClick={() => setExpenseOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Add expense</span>
            <span className="sm:hidden">Expense</span>
          </Button>
        </div>
      </header>

      {/* Balances */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Balances</h2>
        {balances.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Balances Yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {balances.map((b) => (
              <li key={b.userId} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{b.name ?? memberName(group.members, b.userId)}</span>
                <Badge variant={b.netBalance > 0 ? 'success' : b.netBalance < 0 ? 'danger' : 'default'}>
                  {b.netBalance > 0 ? '+' : ''}
                  {formatCurrency(b.netBalance)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Simplified settlements */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-medium text-foreground">Suggested Settlements</h2>
        </div>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Everyone Is Settled Up.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {suggestions.map((s, i) => {
              const currentUserId = String(user?._id ?? user?.id)
              const isMyDebt = String(s.fromUser) === currentUserId
              return (
                <li
                  key={`${s.fromUser}-${s.toUser}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-foreground">
                    {s.fromName ?? memberName(group.members, s.fromUser)}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    {s.toName ?? memberName(group.members, s.toUser)}
                    <span className="font-semibold">{formatCurrency(s.amount)}</span>
                  </span>
                  <Button
                    size="sm"
                    variant={isMyDebt ? 'outline' : 'ghost'}
                    disabled={!isMyDebt}
                    loading={createSettlement.isPending && isMyDebt}
                    onClick={() => handleSettle(s)}
                  >
                    {isMyDebt ? 'Settle' : 'Waiting for payment'}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {/* Group expenses */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Group Expenses</h2>
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No Expenses Yet"
            description="Add The First Shared Expense For This Group."
          />
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((t) => {
              const currentUserId = String(user?._id ?? user?.id)
              const isCreator = String(t.userId) === currentUserId
              return (
                <li key={t._id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Paid by {t.paidBy?.name ?? 'Unknown'} · {formatDate(t.date)} ·{' '}
                      {t.splitType} split
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCreator ? (
                      <Button variant="ghost" size="icon" onClick={() => setEditTxn(t)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only">Edit {t.description}</span>
                      </Button>
                    ) : null}
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {/* Members */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Members</h2>
        <ul className="divide-y divide-border">
          {group.members?.map((m) => {
            const id = String(m.userId?._id ?? m.userId)
            return (
              <li key={id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.userId?.name ?? 'Member'}</p>
                  <p className="text-xs text-muted-foreground">{m.userId?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.role === 'admin' ? 'primary' : 'default'} className="capitalize">{m.role}</Badge>
                  {isCreator && m.role !== 'admin' ? (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(id)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">{`Remove ${m.userId?.name}`}</span>
                    </Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      <Modal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        title="Add Group Expense"
        wide
      >
        {expenseOpen ? (
          <SplitExpenseForm group={group} onDone={() => setExpenseOpen(false)} />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(editTxn)}
        onClose={() => setEditTxn(null)}
        title="Edit Group Expense"
        wide
      >
        {editTxn ? (
          <EditExpenseForm group={group} transaction={editTxn} onDone={() => setEditTxn(null)} />
        ) : null}
      </Modal>

      <Modal open={memberOpen} onClose={() => setMemberOpen(false)} title="Add Member">
        <form onSubmit={handleAddMember} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="member-email">Member Email</Label>
            <Input
              id="member-email"
              type="email"
              required
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="friend@example.com"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              They must already have an Expensio account.
            </p>
            <ErrorMessage>{memberError}</ErrorMessage>
          </div>
          <Button type="submit" loading={addMember.isPending}>
            Add member
          </Button>
        </form>
      </Modal>
    </div>
  )
}
