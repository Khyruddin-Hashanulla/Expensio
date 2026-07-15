import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRound, IndianRupee, DollarSign, KeyRound, CalendarDays, Mail, LogOut, Trash2, AlertTriangle } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Button, Input, Label, Card, ErrorMessage, Badge, Modal } from '../components/ui.jsx'
import { cn, formatDate } from '../lib/format.js'

const CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee', symbol: '₹', icon: IndianRupee },
  { code: 'USD', label: 'US Dollar', symbol: '$', icon: DollarSign },
]

function Avatar({ user }) {
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl || "/placeholder.svg"}
        alt={`${user.name}'s avatar`}
        referrerPolicy="no-referrer"
        className="h-20 w-20 rounded-full border-2 border-primary/40 object-cover"
      />
    )
  }
  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/15 text-2xl font-bold text-primary"
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [currency, setCurrency] = useState(user?.defaultCurrency || 'INR')
  const [saving, setSaving] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteValue, setDeleteValue] = useState('')
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function saveProfile(e) {
    e.preventDefault()
    setProfileError('')
    setSaving(true)
    try {
      const res = await api.put('/users/me', { name, defaultCurrency: currency })
      setUser(res.data.data.user)
      toast({ title: 'Profile Updated', variant: 'success' })
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Could Not Update Profile')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwError('')
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('New Passwords Do Not Match')
      return
    }
    setPwSaving(true)
    try {
      await api.put('/users/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      toast({ title: 'Password Changed. Please Sign In Again.', variant: 'success' })
      await logout()
      navigate('/login')
    } catch (err) {
      setPwError(err.response?.data?.message || 'Could Not Change Password')
    } finally {
      setPwSaving(false)
    }
  }

  async function handleSignOut() {
    await logout()
    navigate('/login')
  }

  function openDelete() {
    setDeleteValue('')
    setDeleteError('')
    setDeleteOpen(true)
  }

  async function confirmDelete() {
    setDeleteError('')
    setDeleteSaving(true)
    try {
      await api.delete('/users/me', { data: { password: user?.hasPassword ? deleteValue : undefined } })
      toast({ title: 'Account deleted', variant: 'success' })
      setDeleteOpen(false)
      await logout()
      navigate('/login')
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Could not delete account')
    } finally {
      setDeleteSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="mt-1 text-sm text-muted">Manage Your Account Details And Preferences</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-negative/50 hover:text-negative"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </header>

      {/* Identity card */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar user={user} />
          <div className="flex min-w-0 flex-col items-center gap-1.5 sm:items-start">
            <h2 className="text-lg font-semibold text-foreground">{user?.name}</h2>
            <p className="flex max-w-full items-center gap-1.5 text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{user?.email}</span>
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Member since {user?.createdAt ? formatDate(user.createdAt) : '—'}
            </p>
            <div className="mt-1 flex gap-2">
              <Badge>{user?.defaultCurrency === 'USD' ? '$ USD' : '₹ INR'}</Badge>
              {user?.hasGoogle ? <Badge variant="success">Google Linked</Badge> : null}
            </div>
          </div>
        </div>
      </Card>

      {/* Edit profile */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
          Account details
        </h2>
        <form onSubmit={saveProfile} className="flex max-w-md flex-col gap-4">
          <div>
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
            />
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-foreground">Default Currency</legend>
            <div className="grid grid-cols-2 gap-3">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  aria-pressed={currency === c.code}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                    currency === c.code
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface hover:border-primary/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full',
                      currency === c.code ? 'bg-primary text-primary-foreground' : 'bg-surface-hover text-muted',
                    )}
                  >
                    <c.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{c.code}</span>
                    <span className="block text-xs text-muted">{c.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <ErrorMessage>{profileError}</ErrorMessage>
          <Button type="submit" loading={saving} className="self-start">
            Save changes
          </Button>
        </form>
      </Card>

      {/* Change password */}
      <Card className="p-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
          {user?.hasPassword ? 'Change Password' : 'Set A Password'}
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          {user?.hasPassword
            ? 'You Will Be Signed Out Of All Devices After Changing Your Password.'
            : 'Your Account Uses Google Sign-In. Set A Password To Also Sign In With Email.'}
        </p>
        <form onSubmit={changePassword} className="flex max-w-md flex-col gap-4">
          {user?.hasPassword ? (
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
              />
            </div>
          ) : null}
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
              placeholder="At Least 8 Characters"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
            />
            <ErrorMessage>{pwError}</ErrorMessage>
          </div>
          <Button type="submit" loading={pwSaving} className="self-start">
            {user?.hasPassword ? 'Change Password' : 'Set password'}
          </Button>
        </form>
      </Card>

      {/* Danger zone */}
      <Card className="border-negative/30 p-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-negative">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Delete account
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Permanently delete your account. Your personal data will be anonymized and you will be
          signed out of all devices. Your transaction history inside groups is preserved so balances
          and records stay intact for other members.
        </p>
        <Button type="button" variant="destructive" onClick={openDelete}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete account
        </Button>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete account">
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-muted">
            This action cannot be undone. Your account will be permanently deleted and anonymized.
            Transaction history you share with groups will remain so other members keep accurate
            records.
          </p>

          {user?.hasPassword ? (
            <div>
              <Label htmlFor="delete-password">Enter your password to confirm</Label>
              <Input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                value={deleteValue}
                onChange={(e) => setDeleteValue(e.target.value)}
                placeholder="Your current password"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
              <Input
                id="delete-confirm"
                value={deleteValue}
                onChange={(e) => setDeleteValue(e.target.value)}
                placeholder="DELETE"
              />
            </div>
          )}

          <ErrorMessage>{deleteError}</ErrorMessage>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={deleteSaving}
              disabled={user?.hasPassword ? !deleteValue : deleteValue.trim().toUpperCase() !== 'DELETE'}
              onClick={confirmDelete}
            >
              Delete account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
