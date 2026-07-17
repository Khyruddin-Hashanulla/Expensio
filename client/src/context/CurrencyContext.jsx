import { createContext, useContext, useState, useCallback } from 'react'
import { setDefaultCurrency } from '../lib/format.js'

export const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState('INR')

  const setCurrency = useCallback((c) => {
    const val = c === 'INR' || c === 'USD' ? c : 'INR'
    setCurrencyState(val)
    setDefaultCurrency(val)
  }, [])

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
