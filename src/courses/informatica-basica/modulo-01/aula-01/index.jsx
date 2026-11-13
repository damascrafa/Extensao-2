import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const PARTS = [
  { id: 'monitor', name: 'Monitor', text: 'A tela. Mostra tudo o que o computador está fazendo.' },
  { id: 'teclado', name: 'Teclado', text: 'Serve para digitar letras, números e comandos.' },
  { id: 'mouse', name: 'Mouse', text: 'Move a seta na tela. O clique esquerdo seleciona e abre.' },
  { id: 'gabinete', name: 'Gabinete', text: 'A caixa com o "cérebro" do computador: processador, memória e armazenamento.' },
]

// Aula de exemplo: explore as 4 partes. Ao ver todas, avisa a plataforma que a aula pode ser concluída.
export default function Aula({ onComplete }) {
  const [seen, setSeen] = useState([])
  const [current, setCurrent] = useState(null)

  function open(part) {
    setCurrent(part)
    if (!seen.includes(part.id)) {
      const next = [...seen, part.id]
      setSeen(next)
      if (next.length === PARTS.length) onComplete?.()
    }
  }

  return (
    <div className="space-y-6">
      <p className="max-w-prose">
        Um computador é feito de várias partes que trabalham juntas. Toque em cada uma para saber para que serve.
      </p>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {PARTS.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => open(p)}
              aria-pressed={current?.id === p.id}
              className={`btn w-full ${current?.id === p.id ? 'btn-primary' : 'btn-ghost'}`}
            >
              {seen.includes(p.id) && <span aria-label="Já visto">✓</span>}
              {p.name}
            </button>
          </li>
        ))}
      </ul>
      <div aria-live="polite" className="min-h-[5rem] rounded-2xl bg-white p-5 ring-1 ring-brand-100">
        <AnimatePresence mode="wait">
          {current ? (
            <motion.div key={current.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <h3 className="text-lg">{current.name}</h3>
              <p>{current.text}</p>
            </motion.div>
          ) : (
            <p className="text-ink/60">Escolha uma parte acima.</p>
          )}
        </AnimatePresence>
      </div>
      <p className="text-sm text-ink/70">{seen.length} de {PARTS.length} partes exploradas.</p>
    </div>
  )
}
