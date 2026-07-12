import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, ChevronRight } from 'lucide-react'
import { useGroups, useGroupMutations } from '../hooks/useData.js'
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

const GROUP_TYPES = [
  { value: 'household', label: 'Household' },
  { value: 'trip', label: 'Trip' },
  { value: 'team', label: 'Team' },
  { value: 'other', label: 'Other' },
]

export default function GroupsPage() {
  const { data, isLoading } = useGroups()
  const { create } = useGroupMutations()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'household' })
  const [error, setError] = useState('')

  const groups = data?.groups ?? []

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await create.mutateAsync(form)
      toast({ title: 'Group Created', variant: 'success' })
      setOpen(false)
      setForm({ name: '', type: 'household' })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable To Create Group.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Groups</h1>
          <p className="text-sm text-muted-foreground">Split Expenses With Friends And Family</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New group
        </Button>
      </header>

      {isLoading ? (
        <Spinner />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Groups Yet"
          description="Create A Group To Start Splitting Expenses With Others."
          action={
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              New group
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <Link key={g._id} to={`/groups/${g._id}`}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:border-primary/50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{g.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge variant="primary" className="capitalize">{g.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {g.members?.length ?? 0} member{(g.members?.length ?? 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Group">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Trip To Lisbon"
            />
          </div>
          <div>
            <Label htmlFor="group-type">Type</Label>
            <Select
              id="group-type"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {GROUP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <ErrorMessage>{error}</ErrorMessage>
          </div>
          <Button type="submit" loading={create.isPending}>
            Create group
          </Button>
        </form>
      </Modal>
    </div>
  )
}
