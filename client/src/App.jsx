import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext.jsx'
import { Spinner } from './components/ui.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import AppLayout from './components/AppLayout.jsx'
import DevCredit from './components/DevCredit.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ExpensesPage from './pages/ExpensesPage.jsx'
import BudgetsPage from './pages/BudgetsPage.jsx'
import GroupsPage from './pages/GroupsPage.jsx'
import GroupDetailPage from './pages/GroupDetailPage.jsx'
import SettlementsPage from './pages/SettlementsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

const MIN_SPLASH_MS = 1500
const HEALTH_TIMEOUT_MS = 8000
const HEALTH_URL = `${import.meta.env.VITE_API_URL || '/api/v1'}/health`

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner className="min-h-dvh" />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner className="min-h-dvh" />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const [ready, setReady] = useState(() => sessionStorage.getItem('app:ready') === '1')
  const [error, setError] = useState(null)
  const startRef = useRef(Date.now())
  const timerRef = useRef(null)

  function checkHealth() {
    setError(null)
    startRef.current = Date.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

    return fetch(HEALTH_URL, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeout)
        if (data.status === 'ok') {
          const elapsed = Date.now() - startRef.current
          const remaining = Math.max(0, MIN_SPLASH_MS - elapsed)
          timerRef.current = setTimeout(() => {
            sessionStorage.setItem('app:ready', '1')
            setReady(true)
          }, remaining)
        } else {
          setError('Server not ready')
        }
      })
      .catch(() => {
        clearTimeout(timeout)
        setError('Unable to connect')
      })
  }

  useEffect(() => {
    if (!ready) checkHealth()
    return () => clearTimeout(timerRef.current)
  }, [])

  function handleRetry() {
    checkHealth()
  }

  return (
    <>
      <AnimatePresence>
        {ready ? null : <SplashScreen key="splash" error={error} onRetry={handleRetry} />}
      </AnimatePresence>

      {ready ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
          <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
          <Route path="/reset-password/:token" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
          <Route element={<Protected><AppLayout /></Protected>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:groupId" element={<GroupDetailPage />} />
            <Route path="/settlements" element={<SettlementsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : null}

      <DevCredit />
    </>
  )
}
