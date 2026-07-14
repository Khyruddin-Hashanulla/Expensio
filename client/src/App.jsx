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
const HEALTH_TIMEOUT_MS = 30000
const MAX_RETRIES = 3
const RETRY_DELAYS = [2000, 4000, 8000]
const MSG_INTERVAL = 4000

const WAITING_MESSAGES = [
  'Connecting to server...',
  'Waking up the servers...',
  'Still starting up...',
  'Almost there...',
  'Just a moment longer...',
]

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
  const [retrying, setRetrying] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const abortRef = useRef(null)
  const timerRef = useRef(null)
  const msgTimerRef = useRef(null)

  function scheduleRetry(attempt, reason) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS[attempt] || 8000
      timerRef.current = setTimeout(() => checkHealth(attempt + 1), delay)
    } else {
      setRetrying(false)
      setError(reason || 'Unable to connect to server')
    }
  }

  function checkHealth(attempt = 0) {
    abortRef.current?.abort()
    clearTimeout(timerRef.current)
    setError(null)
    setRetrying(attempt > 0)

    const controller = new AbortController()
    abortRef.current = controller
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

    fetch(HEALTH_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Server not ready')
        return res.json()
      })
      .then((data) => {
        clearTimeout(timeout)
        if (data.status === 'ok') {
          setRetrying(false)
          timerRef.current = setTimeout(() => {
            sessionStorage.setItem('app:ready', '1')
            setReady(true)
          }, MIN_SPLASH_MS)
        } else {
          scheduleRetry(attempt, 'Server not ready')
        }
      })
      .catch((err) => {
        clearTimeout(timeout)
        scheduleRetry(attempt, 'Unable to connect to server')
      })
  }

  useEffect(() => {
    if (retrying) {
      setMsgIndex(0)
      msgTimerRef.current = setInterval(() => {
        setMsgIndex((prev) => (prev + 1) % WAITING_MESSAGES.length)
      }, MSG_INTERVAL)
    } else {
      clearInterval(msgTimerRef.current)
      setMsgIndex(0)
    }
    return () => clearInterval(msgTimerRef.current)
  }, [retrying])

  useEffect(() => {
    if (!ready) checkHealth()
    return () => {
      abortRef.current?.abort()
      clearTimeout(timerRef.current)
      clearInterval(msgTimerRef.current)
    }
  }, [])

  function handleRetry() {
    checkHealth()
  }

  return (
    <>
      <AnimatePresence>
        {ready ? null : (
          <SplashScreen
            key="splash"
            error={error}
            retrying={retrying}
            waitMessage={retrying ? WAITING_MESSAGES[msgIndex] : ''}
            onRetry={handleRetry}
          />
        )}
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
