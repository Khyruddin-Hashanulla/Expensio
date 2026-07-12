import { motion, useReducedMotion } from 'framer-motion'

/**
 * Floating developer credit tag, fixed at the bottom-right of every page.
 * Glassmorphism background, fade-in on load, gentle hover scale.
 */
export default function DevCredit() {
  const reduceMotion = useReducedMotion()

  return (
    <motion.a
      href="https://www.linkedin.com/in/khyruddin-hashanulla/"
      target="_blank"
      rel="noopener noreferrer"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
      whileHover={reduceMotion ? undefined : { scale: 1.05 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      className="fixed bottom-4 right-4 z-30 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-border/60 bg-surface/70 px-3.5 py-2 text-xs text-muted shadow-lg backdrop-blur-md transition-colors hover:border-primary/50 hover:text-foreground"
      aria-label="Designed and developed by Khyruddin Hashanulla"
    >
      <motion.span
        className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
        animate={reduceMotion ? undefined : { opacity: [1, 0.4, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <span>
        Designed &amp; Developed By <span className="font-semibold text-primary">Khyruddin Hashanulla</span>
      </span>
    </motion.a>
  )
}
