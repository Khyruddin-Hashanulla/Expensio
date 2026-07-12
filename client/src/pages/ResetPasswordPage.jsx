import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, ShieldX } from 'lucide-react'
import { api } from '../lib/api.js'
import { Button, Input, Label, Card, ErrorMessage, Spinner } from '../components/ui.jsx'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: tokenState, isLoading: verifying } = useQuery({
    queryKey: ['reset-token', token],
    queryFn: async () => {
      const res = await api.get(`/auth/verify-reset-token/${token}`)
      return res.data.data
    },
    retry: false,
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords Do Not Match')
      return
    }
    setLoading(true)
    try {
      await api.post(`/auth/reset-password/${token}`, { password: form.password })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Could Not Reset Password. Try Requesting A New Link.')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) return <Spinner className="min-h-dvh" />

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
            {tokenState?.valid ? (
              <ShieldCheck className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            ) : (
              <ShieldX className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            )}
          </span>
          <h1 className="text-xl font-semibold text-foreground">
            {tokenState?.valid ? 'Set A New Password' : 'Link Expired'}
          </h1>
        </div>

        <Card className="p-5">
          {tokenState?.valid ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="At Least 8 Characters"
                />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat Your New Password"
                />
                <ErrorMessage>{error}</ErrorMessage>
              </div>
              <Button type="submit" loading={loading} className="w-full">
                Reset password
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <p className="text-sm leading-relaxed text-muted">
                This password reset link is invalid or has expired. Request a new one to continue.
              </p>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Request a new link
              </Link>
            </div>
          )}
        </Card>

        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back To Sign In
          </Link>
        </p>
      </div>
    </main>
  )
}
