import { motion } from 'motion/react'

export default function ProgressBar({ value = 0, label = 'Progresso' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className="h-3 overflow-hidden rounded-full bg-brand-100"
      >
        <motion.div
          className="h-full rounded-full bg-brand-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-1 text-sm text-ink/70">{Math.round(pct)}%</p>
    </div>
  )
}
