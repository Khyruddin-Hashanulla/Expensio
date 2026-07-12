const OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

/** Animated Monthly / Yearly segmented toggle. */
export default function PeriodToggle({ value, onChange, className = '' }) {
  return (
    <div
      role="radiogroup"
      aria-label="Summary period"
      className={`relative inline-flex rounded-lg border border-border bg-secondary p-0.5 ${className}`}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`relative z-10 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
