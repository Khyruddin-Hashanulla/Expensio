let defaultCurrency = 'USD'

/** Called by AuthContext whenever the signed-in user (and their currency preference) changes. */
export function setDefaultCurrency(currency) {
  if (currency === 'INR' || currency === 'USD') defaultCurrency = currency
}

export function formatCurrency(amount, currency) {
  const cur = currency || defaultCurrency
  return new Intl.NumberFormat(cur === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: cur,
  }).format(amount ?? 0)
}

export function formatDate(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export const CATEGORIES = [
  'food',
  'transport',
  'housing',
  'utilities',
  'entertainment',
  'health',
  'shopping',
  'travel',
  'education',
  'other',
]

export const CATEGORY_LABELS = {
  food: 'Food & Dining',
  transport: 'Transport',
  housing: 'Housing',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  health: 'Health',
  shopping: 'Shopping',
  travel: 'Travel',
  education: 'Education',
  other: 'Other',
}
