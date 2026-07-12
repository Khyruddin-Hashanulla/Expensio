import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wallet, MailCheck, ArrowLeft } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Button, Input, Label, Card, ErrorMessage, Select } from '../components/ui.jsx'
import GoogleButton from '../components/GoogleButton.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('details') // 'details' | 'verify'
  const [form, setForm] = useState({ name: '', email: '', password: '', defaultCurrency: 'INR' })
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const otpRef = useRef(null)

  async function sendOtp(e) {
    e?.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password Must Be At Least 8 Characters.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/send-otp', { email: form.email })
      setInfo(res.data.message)
      // In development the server returns the code so the flow works without an email provider
      setDevOtp(res.data.data?.devOtp || '')
      setStep('verify')
      setTimeout(() => otpRef.current?.focus(), 50)
    } catch (err) {
      setError(err.response?.data?.message || 'Could Not Send Verification Code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ ...form, otp })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable To Create Account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Link to="/" className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
            <Wallet className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            <span className="sr-only">Expensio home</span>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">
            {step === 'verify' ? 'Verify Your Email' : 'Create Your Account'}
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            {step === 'verify'
              ? `Enter The 6-Digit Code Sent To ${form.email}`
              : 'Track Expenses And Split Bills With Ease'}
          </p>
        </div>

        <Card className="p-5">
          {step === 'details' ? (
            <>
              <form onSubmit={sendOtp} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
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
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    id="currency"
                    value={form.defaultCurrency}
                    onChange={(e) => setForm((f) => ({ ...f, defaultCurrency: e.target.value }))}
                  >
                    <option value="INR">Indian Rupee (Rs.)</option>
                    <option value="USD">US Dollar ($)</option>
                  </Select>
                  <ErrorMessage>{error}</ErrorMessage>
                </div>
                <Button type="submit" loading={loading} className="w-full">
                  Send verification code
                </Button>
              </form>
              <div className="my-4 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <GoogleButton onError={setError} />
            </>
          ) : (
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm text-foreground">
                <MailCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="leading-relaxed">{info}</span>
              </div>
              {devOtp ? (
                <p className="rounded-lg border border-dashed border-border p-2.5 text-center text-xs text-muted-foreground">
                  Development mode — your code is{' '}
                  <span className="font-mono text-sm font-bold tracking-widest text-primary">{devOtp}</span>
                </p>
              ) : null}
              <div>
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  ref={otpRef}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-Digit Code"
                  className="text-center font-mono text-lg tracking-[0.4em]"
                />
                <ErrorMessage>{error}</ErrorMessage>
              </div>
              <Button type="submit" loading={loading} disabled={otp.length !== 6} className="w-full">
                Verify &amp; create account
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('details')
                    setOtp('')
                    setError('')
                  }}
                  className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading}
                  className="font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {'Already Have An Account? '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
