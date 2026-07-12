import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

let gsiScriptPromise = null
function loadGsiScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  return gsiScriptPromise
}

/**
 * "Continue with Google" button. Renders only when the server has a
 * GOOGLE_CLIENT_ID configured; otherwise renders nothing.
 */
export default function GoogleButton({ onSuccess, onError }) {
  const { loginWithGoogle } = useAuth()
  const { data } = useQuery({
    queryKey: ['google-config'],
    queryFn: async () => {
      const res = await api.get('/auth/google/config')
      return res.data.data
    },
    staleTime: Infinity,
  })
  const containerRef = useRef(null)
  const [ready, setReady] = useState(false)

  const clientId = data?.clientId

  useEffect(() => {
    if (!clientId || !containerRef.current) return
    let cancelled = false

    loadGsiScript()
      .then(() => {
        if (cancelled || !containerRef.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              await loginWithGoogle(response.credential)
              onSuccess?.()
            } catch (err) {
              onError?.(err.response?.data?.message || 'Google sign-in failed')
            }
          },
        })
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'pill',
        })
        setReady(true)
      })
      .catch(() => onError?.('Could Not Load Google Sign-In'))

    return () => {
      cancelled = true
    }
  }, [clientId, loginWithGoogle, onSuccess, onError])

  if (!clientId) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div ref={containerRef} className={ready ? 'flex justify-center' : 'sr-only'} />
    </div>
  )
}
