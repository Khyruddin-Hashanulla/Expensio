import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, MailCheck } from 'lucide-react'
import { api } from '../lib/api.js'
import { Button, Input, Label, Card, ErrorMessage } from '../components/ui.jsx'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [resetUrl, setResetUrl] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email })
      setSent(true)
      // In development the server returns the reset link directly
      setResetUrl(res.data.data?.resetUrl || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Something Went Wrong. Try Again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
            <KeyRound className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold text-foreground">Forgot Your Password?</h1>
          <p className="text-center text-sm leading-relaxed text-muted">
            Enter your email and we&apos;ll send you a link to reset it.
          </p>
        </div>

        <Card className="p-5">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <MailCheck className="h-8 w-8 text-positive" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-foreground">
                If an account exists for <span className="font-medium">{email}</span>, a reset link has been
                sent.
              </p>
              {resetUrl ? (
                <a
                  href={resetUrl}
                  className="w-full truncate rounded-lg border border-border bg-surface-hover px-3 py-2 text-xs text-primary hover:underline"
                >
                  Dev mode: open reset link
                </a>
              ) : null}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <ErrorMessage>{error}</ErrorMessage>
              </div>
              <Button type="submit" loading={loading} className="w-full">
                Send reset link
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-4 text-center text-sm text-muted">
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back To Sign In
          </Link>
        </p>
      </div>
    </main>
  )
}
