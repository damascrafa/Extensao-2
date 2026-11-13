import { friendlyError } from '../lib/errors'

export function Alert({ type = 'info', children }) {
  const styles = {
    info: 'bg-brand-50 text-brand-700',
    success: 'bg-emerald-50 text-leaf',
    error: 'bg-red-50 text-danger',
  }
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 font-bold ${styles[type]}`}>
      {children}
    </div>
  )
}

export function Spinner({ label = 'Carregando…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-ink/70">
      <span className="h-5 w-5 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500 motion-reduce:animate-none" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-bold text-danger">{friendlyError(error, 'Não foi possível carregar os dados.')}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-ghost mt-4">
          Tentar de novo
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <h3 className="text-xl">{title}</h3>
      {children && <p className="mt-2 text-ink/70">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
