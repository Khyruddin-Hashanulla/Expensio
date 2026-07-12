import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { cn } from '../lib/format.js'

let gsiReady = null
function loadGsiClient() {
  if (window.google?.accounts) return Promise.resolve()
  if (!gsiReady) {
    gsiReady = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.onload = resolve
      s.onerror = () => reject(new Error('Failed to load Google Identity Services'))
      document.head.appendChild(s)
    })
  }
  return gsiReady
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function SpinnerDots() {
  return (
    <span className="flex items-center gap-1" aria-label="Signing in">
      <motion.span className="h-1.5 w-1.5 rounded-full bg-current" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
      <motion.span className="h-1.5 w-1.5 rounded-full bg-current" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
      <motion.span className="h-1.5 w-1.5 rounded-full bg-current" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
    </span>
  )
}

export default function GoogleButton({ onSuccess, onError, label = 'Continue with Google' }) {
  const { loginWithGoogle } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const [showDivider, setShowDivider] = useState(false)
  const tokenClientRef = useRef(null)
  const callbackFiredRef = useRef(false)
  const popupBlockedRef = useRef(false)

  const { data, isSuccess } = useQuery({
    queryKey: ['google-config'],
    queryFn: async () => {
      const res = await api.get('/auth/google/config')
      return res.data.data
    },
    staleTime: Infinity,
  })

  const clientId = data?.clientId

  const handleCredentialResponse = useCallback(async (response) => {
    if (callbackFiredRef.current) return
    callbackFiredRef.current = true
    setSigningIn(true)
    popupBlockedRef.current = false
    try {
      await loginWithGoogle(response.credential)
      onSuccess?.()
    } catch (err) {
      setSigningIn(false)
      callbackFiredRef.current = false
      onError?.(err.response?.data?.message || 'Google sign-in failed')
    }
  }, [loginWithGoogle, onSuccess, onError])

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    loadGsiClient()
      .then(() => {
        if (cancelled) return
        setShowDivider(true)

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid profile email',
          callback: (response) => {
            if (response.error) {
              callbackFiredRef.current = false
              setSigningIn(false)
              popupBlockedRef.current = false
              if (response.error === 'popup_blocked_by_browser') {
                onError?.('Popup was blocked by your browser. Please allow popups for this site.')
              }
              return
            }
            handleCredentialResponse({ credential: response.id_token })
          },
          error_callback: () => {
            callbackFiredRef.current = false
            setSigningIn(false)
            popupBlockedRef.current = false
          },
        })
      })
      .catch((err) => onError?.(err.message))
    return () => { cancelled = true }
  }, [clientId, handleCredentialResponse, onError])

  function handleClick() {
    if (signingIn || !tokenClientRef.current) return
    callbackFiredRef.current = false
    popupBlockedRef.current = false
    tokenClientRef.current.requestAccessToken()
    setTimeout(() => {
      if (!callbackFiredRef.current && !popupBlockedRef.current) {
        popupBlockedRef.current = true
        setSigningIn(false)
        onError?.('Popup was blocked by your browser. Please allow popups for this site.')
      }
    }, 5000)
  }

  if (!clientId && isSuccess) return null
  if (!isSuccess) return null

  return (
    <>
      {showDivider && (
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}

      <motion.button
        type="button"
        onClick={handleClick}
        disabled={signingIn}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative flex h-11 w-full items-center justify-center gap-3 overflow-hidden rounded-xl border text-sm font-medium transition-colors',
          'border-border bg-surface text-foreground hover:border-primary/40 hover:bg-surface-hover',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
        aria-label={signingIn ? 'Signing in with Google' : label}
      >
        {signingIn ? (
          <>
            <motion.span
              className="absolute inset-0 rounded-xl bg-primary/5"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
            <GoogleIcon />
            <SpinnerDots />
          </>
        ) : (
          <>
            <GoogleIcon />
            {label}
          </>
        )}
      </motion.button>
    </>
  )
}
