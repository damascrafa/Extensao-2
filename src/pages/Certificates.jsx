import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, Spinner } from '../components/Feedback'
import { useMyCertificates } from '../hooks/queries'

export default function Certificates() {
  const { data, isLoading, error, refetch } = useMyCertificates()
  if (isLoading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl">Meus certificados</h1>
      {data.length ? (
        <ul className="space-y-3">
          {data.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 ring-1 ring-brand-100">
              <div>
                <p className="font-bold">{c.course_name}</p>
                <p className="text-sm text-ink/70">Emitido em {new Date(c.issued_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <Link to={`/certificados/${c.id}`} className="btn btn-ghost">Abrir</Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Nenhum certificado ainda" action={<Link to="/painel" className="btn btn-primary">Ir para o painel</Link>}>
          Conclua todas as aulas e a avaliação final de um curso para receber o seu.
        </EmptyState>
      )}
    </div>
  )
}
