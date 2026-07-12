import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Users,
  ArrowLeftRight,
  LogOut,
  Menu,
  X,
  Wallet,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { cn } from '../lib/format.js'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: '/settlements', label: 'Settlements', icon: ArrowLeftRight },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )
          }
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const sidebarContent = (
    <>
      <div className="mb-6 flex items-center gap-2 px-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Wallet className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
        </span>
        <span className="text-base font-semibold text-foreground">Expensio</span>
      </div>
      <NavItems onNavigate={() => setMobileOpen(false)} />
      <div className="mt-auto shrink-0 border-t border-border pt-3">
        <NavLink
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl || '/placeholder.svg'}
              alt=""
              referrerPolicy="no-referrer"
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary"
              aria-hidden="true"
            >
              {(user?.name || '?')
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium leading-5 text-foreground">{user?.name}</span>
            <span className="block truncate text-xs leading-4 text-muted-foreground">{user?.email}</span>
          </span>
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border p-4 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Wallet className="h-3.5 w-3.5 text-primary-foreground" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-foreground">Expensio</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Open menu</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col overflow-y-auto bg-background p-4">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close menu</span>
            </button>
            {sidebarContent}
          </div>
        </div>
      ) : null}

      <main className="flex-1 px-4 pb-10 pt-20 md:px-8 md:pt-8">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
