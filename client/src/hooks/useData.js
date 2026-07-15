import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '../lib/api.js'
import { getSocket } from '../lib/socket.js'

// ---------- Transactions ----------
export function useTransactions(params = {}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: async () => {
      const res = await api.get('/transactions', { params })
      return res.data.data
    },
  })
}

export function useTransactionMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['summary'] })
    qc.invalidateQueries({ queryKey: ['budgets'] })
    qc.invalidateQueries({ queryKey: ['groups'] })
    qc.invalidateQueries({ queryKey: ['balances'] })
  }
  const create = useMutation({
    mutationFn: (body) => api.post('/transactions', body),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/transactions/${id}`, body),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/transactions/${id}`),
    onSuccess: invalidate,
  })
  return { create, update, remove }
}

export function useSummary(period = 'monthly') {
  return useQuery({
    queryKey: ['summary', period],
    queryFn: async () => {
      const res = await api.get('/transactions/summary', { params: { period } })
      return res.data.data
    },
    placeholderData: keepPreviousData,
  })
}

// ---------- Budgets ----------
export function useBudgetStatus(period = 'monthly') {
  return useQuery({
    queryKey: ['budgets', 'status', period],
    queryFn: async () => {
      const res = await api.get('/budgets/status', { params: { period } })
      return res.data.data
    },
    placeholderData: keepPreviousData,
  })
}

export function useBudgetMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['budgets'] })
  const create = useMutation({
    mutationFn: (body) => api.post('/budgets', body),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/budgets/${id}`, body),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/budgets/${id}`),
    onSuccess: invalidate,
  })
  return { create, update, remove }
}

// ---------- Groups ----------
export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await api.get('/groups')
      return res.data.data
    },
  })
}

export function useGroup(groupId) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}`)
      return res.data.data
    },
    enabled: Boolean(groupId),
  })
}

export function useGroupBalances(groupId) {
  return useQuery({
    queryKey: ['balances', groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/balances`)
      return res.data.data
    },
    enabled: Boolean(groupId),
  })
}

export function useSimplifiedDebts(groupId) {
  return useQuery({
    queryKey: ['simplify', groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/simplify`)
      return res.data.data
    },
    enabled: Boolean(groupId),
  })
}

export function useGroupMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['groups'] })
  const create = useMutation({
    mutationFn: (body) => api.post('/groups', body),
    onSuccess: invalidate,
  })
  const addMember = useMutation({
    mutationFn: ({ groupId, email }) => api.post(`/groups/${groupId}/members`, { email }),
    onSuccess: invalidate,
  })
  const removeMember = useMutation({
    mutationFn: ({ groupId, userId }) => api.delete(`/groups/${groupId}/members/${userId}`),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (groupId) => api.delete(`/groups/${groupId}`),
    onSuccess: invalidate,
  })
  return { create, addMember, removeMember, remove }
}

// ---------- Settlements ----------
export function useGroupSettlements(groupId) {
  return useQuery({
    queryKey: ['settlements', groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/settlements`)
      return res.data.data
    },
    enabled: Boolean(groupId),
  })
}

export function useSettlementMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['settlements'] })
    qc.invalidateQueries({ queryKey: ['balances'] })
    qc.invalidateQueries({ queryKey: ['simplify'] })
    qc.invalidateQueries({ queryKey: ['groups'] })
  }
  const create = useMutation({
    mutationFn: (body) => api.post('/settlements', body),
    onSuccess: invalidate,
  })
  const markCompleted = useMutation({
    mutationFn: (id) => api.put(`/settlements/${id}`),
    onSuccess: invalidate,
  })
  return { create, markCompleted }
}

// ---------- Notifications ----------
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications', { params: { limit: 20 } })
      return res.data.data
    },
    refetchInterval: 30000,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count')
      return res.data.data.count
    },
    refetchInterval: 15000,
  })
}

export function useNotificationMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }
  const markRead = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: invalidate,
  })
  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/mark-all-read'),
    onSuccess: invalidate,
  })
  return { markRead, markAllRead }
}

// ---------- Realtime ----------
export function useRealtimeGroup(groupId) {
  const qc = useQueryClient()
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !groupId) return undefined
    socket.emit('group:join', groupId)
    const onUpdate = () => {
      qc.invalidateQueries({ queryKey: ['groups', groupId] })
      qc.invalidateQueries({ queryKey: ['balances', groupId] })
      qc.invalidateQueries({ queryKey: ['simplify', groupId] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['settlements', groupId] })
    }
    socket.on('group:updated', onUpdate)
    return () => {
      socket.emit('group:leave', groupId)
      socket.off('group:updated', onUpdate)
    }
  }, [groupId, qc])
}
