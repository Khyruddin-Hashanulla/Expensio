import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Wallet,
  Users,
  PiggyBank,
  ArrowLeftRight,
  ShieldCheck,
  Zap,
  BarChart3,
  ArrowRight,
  IndianRupee,
  DollarSign,
  Receipt,
  Bell,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Track Every Rupee & Dollar',
    body: 'Log Income And Expenses In Seconds. Monthly And Yearly Views With Beautiful Charts That Show Exactly Where Your Money Goes.',
  },
  {
    icon: Users,
    title: 'Split Bills With Anyone',
    body: 'Create Groups For Trips, Roommates, Or Teams. Equal, Percentage, Or Custom Splits — The Math Is Always Exact To The Paisa.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Settle Up The Smart Way',
    body: 'Our Debt Simplification Engine Finds The Minimum Number Of Payments To Clear Everyone. No More Circular IOUs.',
  },
  {
    icon: PiggyBank,
    title: 'Budgets That Talk Back',
    body: 'Set Monthly Or Yearly Category Budgets And Get Alerts At 80% And 100%. Stay Ahead Of Overspending.',
  },
  {
    icon: ShieldCheck,
    title: 'Bank-Grade Security',
    body: 'Rotating Refresh Tokens, Bcrypt Hashing, Immutable Audit Logs, And Idempotent Settlements. Your Data Is Treated Like Real Money.',
  },
  {
    icon: Zap,
    title: 'Real-Time Everything',
    body: 'Balances Update Live Across Every Device The Moment An Expense Lands. Powered By WebSockets.',
  },
]

const STATS = [
  { value: '2', label: 'Currencies (INR / USD)' },
  { value: '3', label: 'Split Modes' },
  { value: '100%', label: 'Exact To The Cent' },
  { value: '0', label: 'Circular Debts Left' },
]

function FadeIn({ children, delay = 0, className }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const { user } = useAuth()
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      {/* Animated gradient blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 40, 0], y: [0, 24, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, -32, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 24, 0], y: [0, -32, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Nav */}
      <header className="relative z-10">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5"
          aria-label="Landing navigation"
        >
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary sm:h-9 sm:w-9">
              <Wallet className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" aria-hidden="true" />
            </span>
            <span className="text-base font-bold tracking-tight sm:text-lg">Expensio</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 sm:px-5"
              >
                Dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 sm:px-5"
              >
                Get Started
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-16 text-center md:pt-24">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="mb-6 flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-medium text-muted backdrop-blur"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-positive" aria-hidden="true" />
            Personal Finance + Bill Splitting, In One Place
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="max-w-3xl text-balance text-4xl font-extrabold leading-tight tracking-tight md:text-6xl"
          >
            Money, Made <span className="text-primary">Crystal Clear</span> — For You And Your Crew
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted md:text-lg"
          >
            Track Spending, Set Budgets, Split Bills With Friends, And Settle Up With The Fewest Possible
            Payments. Monthly Or Yearly — In Rupees Or Dollars.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              to={user ? '/dashboard' : '/register'}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105"
            >
              {user ? 'Open Dashboard' : 'Start For Free'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface">
                <IndianRupee className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface">
                <DollarSign className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              </span>
              INR &amp; USD Supported
            </div>
          </motion.div>

          {/* Animated notification */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
            className="relative mt-12 w-full max-w-lg mx-auto"
          >
            <motion.div
              animate={reduceMotion ? undefined : {
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_200%] opacity-60 blur-sm"
            />
            <div className="relative flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <motion.span
                animate={reduceMotion ? undefined : {
                  rotate: [-6, 6, -6],
                  scale: [1, 1.08, 1],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15"
              >
                <Receipt className="h-4 w-4 text-primary" aria-hidden="true" />
              </motion.span>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">
                  Track every expense with your group
                </p>
                <p className="text-xs text-muted">
                  Split bills, settle up, and stay in sync — all in real time.
                </p>
              </div>
              <motion.span
                animate={reduceMotion ? undefined : { scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Bell className="h-4 w-4 text-accent" aria-hidden="true" />
              </motion.span>
            </div>
          </motion.div>

          {/* Stats strip */}
          <FadeIn delay={0.15} className="mt-10 w-full">
            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-surface/60 px-4 py-5 backdrop-blur">
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 pb-24" aria-labelledby="features-heading">
          <FadeIn className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Features</p>
            <h2 id="features-heading" className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Everything Your Wallet Wishes It Had
            </h2>
          </FadeIn>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <motion.article
                  whileHover={reduceMotion ? undefined : { y: -4 }}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface/70 p-6 backdrop-blur transition-colors hover:border-primary/40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                    <f.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{f.body}</p>
                </motion.article>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/80 px-8 py-14 text-center backdrop-blur md:py-16">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
              </div>
              <h2 className="relative text-balance text-3xl font-bold tracking-tight md:text-4xl">
                Stop Guessing. Start Knowing.
              </h2>
              <p className="relative mx-auto mt-4 max-w-md text-pretty text-sm leading-relaxed text-muted md:text-base">
                Join Expensio Today — Free Forever For Personal Use. Your First Budget Takes 30 Seconds.
              </p>
              <Link
                to={user ? '/dashboard' : '/register'}
                className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105"
              >
                {user ? 'Open Dashboard' : 'Create Free Account'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted md:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-3.5 w-3.5 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="font-semibold text-foreground">Expensio</span>
          </div>
          <p>Personal Finance + Bill Splitting. INR And USD.</p>
          <p>&copy; {new Date().getFullYear()} Expensio</p>
        </div>
      </footer>
    </div>
  )
}
