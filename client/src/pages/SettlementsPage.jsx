import { useState } from 'react'
import { ArrowRight, ArrowLeftRight } from 'lucide-react'
import { useGroups, useGroupSettlements } from '../hooks/useData.js'
import {
  Card,
  Label,
  Select,
  Spinner,
  EmptyState,
  Badge,
} from '../components/ui.jsx'
import { formatCurrency, formatDate } from '../lib/format.js'

export default function SettlementsPage() {
  const { data: groupData, isLoading: groupsLoading } = useGroups()
  const groups = groupData?.groups ?? []
  const [groupId, setGroupId] = useState('')

  const activeGroupId = groupId || groups[0]?._id
  const { data, isLoading } = useGroupSettlements(activeGroupId)
  const settlements = data?.settlements ?? []

  if (groupsLoading) return <Spinner />

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Settlements</h1>
        <p className="text-sm text-muted-foreground">Payment History Across Your Groups</p>
      </header>

      {groups.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No Groups Yet"
          description="Settlements Appear Here Once You Join A Group And Settle Balances."
        />
      ) : (
        <>
          <div className="w-56">
            <Label htmlFor="settlement-group">Group</Label>
            <Select
              id="settlement-group"
              value={activeGroupId ?? ''}
              onChange={(e) => setGroupId(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <Spinner />
          ) : settlements.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No Settlements Yet"
              description="Use The Settle Button On A Group Page To Record A Payment."
            />
          ) : (
            <Card>
              <ul className="divide-y divide-border">
                {settlements.map((s) => (
                  <li key={s._id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-foreground">
                      <span className="truncate font-medium">{s.fromUser?.name ?? 'Someone'}</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium">{s.toUser?.name ?? 'Someone'}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(s.createdAt)}
                      </span>
                      <Badge variant={s.status === 'completed' ? 'success' : 'warning'}>
                        {s.status}
                      </Badge>
                      <span className="whitespace-nowrap text-sm font-semibold text-foreground tabular-nums">
                        {formatCurrency(s.amount)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
