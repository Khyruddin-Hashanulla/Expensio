import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, RefreshCw } from 'lucide-react'

function DotLoader() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-primary"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function SplashScreen({ error, onRetry }) {
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setShowError(true), 600)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <div className="flex flex-col items-center gap-5">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14, duration: 0.8 }}
          className="flex h-20 w-20 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-[#2dd4bf] to-[#14b8a6] shadow-lg shadow-primary/20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
          >
            <Wallet className="h-10 w-10 text-[#042f2e]" aria-hidden="true" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center gap-3"
        >
          <span className="text-2xl font-bold tracking-tight text-foreground">Expensio</span>
          <AnimatePresence mode="wait">
            {showError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center gap-3"
              >
                <p className="text-xs text-red-400">Unable to connect to server</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-4 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/25"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DotLoader />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  )
}
