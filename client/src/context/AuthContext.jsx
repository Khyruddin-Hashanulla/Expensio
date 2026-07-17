import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { api, setAccessToken, refreshAccessToken } from '../lib/api.js'
import { connectSocket, disconnectSocket } from '../lib/socket.js'
import { CurrencyContext } from './CurrencyContext.jsx'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { setCurrency } = useContext(CurrencyContext)

  const bootstrap = useCallback(async () => {
    try {
      await refreshAccessToken()
      const res = await api.get('/auth/me')
      setUser(res.data.data.user)
      setCurrency(res.data.data.user?.defaultCurrency || 'INR')
      connectSocket()
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [setCurrency])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    const onLogout = () => {
      setUser(null)
      disconnectSocket()
    }
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password })
    setAccessToken(res.data.data.accessToken)
    setUser(res.data.data.user)
    setCurrency(res.data.data.user?.defaultCurrency || 'INR')
    connectSocket()
  }, [setCurrency])

  const register = useCallback(async ({ name, email, password, otp, defaultCurrency }) => {
    const res = await api.post('/auth/register', { name, email, password, otp, defaultCurrency })
    setAccessToken(res.data.data.accessToken)
    setUser(res.data.data.user)
    setCurrency(res.data.data.user?.defaultCurrency || 'INR')
    connectSocket()
  }, [setCurrency])

  const loginWithGoogle = useCallback(async (credential) => {
    const res = await api.post('/auth/google', { credential })
    setAccessToken(res.data.data.accessToken)
    setUser(res.data.data.user)
    setCurrency(res.data.data.user?.defaultCurrency || 'INR')
    connectSocket()
  }, [setCurrency])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore network errors on logout
    }
    setAccessToken(null)
    setUser(null)
    disconnectSocket()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
