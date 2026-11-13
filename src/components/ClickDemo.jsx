import { motion, useReducedMotion } from 'motion/react'

// Um único momento animado: o cursor chega ao botão e dá o "primeiro clique".
// Com prefers-reduced-motion, mostra a cena parada.
export default function ClickDemo() {
  const reduce = useReducedMotion()
  const loop = { duration: 3.6, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md rounded-3xl bg-brand-500 p-5 shadow-xl">
      <div className="mb-4 flex gap-2">
        <span className="h-3 w-3 rounded-full bg-white/40" />
        <span className="h-3 w-3 rounded-full bg-white/40" />
        <span className="h-3 w-3 rounded-full bg-white/40" />
      </div>
      <div className="relative flex h-56 items-center justify-center rounded-2xl bg-white">
        <div className="relative">
          {!reduce && (
            <motion.span
              className="absolute inset-0 rounded-2xl bg-sun"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: [1, 1, 1, 1.9], opacity: [0, 0, 0.7, 0] }}
              transition={{ ...loop, times: [0, 0.58, 0.6, 1] }}
            />
          )}
          <div className="relative rounded-2xl bg-brand-500 px-8 py-4 font-display text-2xl font-extrabold text-white">
            Começar
          </div>
          <motion.svg
            viewBox="0 0 24 24"
            width="44"
            height="44"
            className="absolute left-1/2 top-1/2 drop-shadow"
            initial={reduce ? false : { x: 120, y: 90 }}
            animate={reduce ? { x: 4, y: 4 } : { x: [120, 4, 4, 4], y: [90, 4, 4, 4], scale: [1, 1, 0.85, 1] }}
            transition={reduce ? undefined : { ...loop, times: [0, 0.55, 0.62, 0.75] }}
          >
            <path d="M5 3l14 7-6 2 4 7-3 1.5-4-7-5 4z" fill="#0E1330" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
          </motion.svg>
        </div>
      </div>
    </div>
  )
}
