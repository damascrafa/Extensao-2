import { Link, useParams } from 'react-router-dom'
import { ErrorState, Spinner } from '../components/Feedback'
import Logo from '../components/Logo'
import { useCertificate } from '../hooks/queries'

export default function CertificateView() {
  const { id } = useParams()
  const { data: cert, isLoading, error, refetch } = useCertificate(id)
  if (isLoading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!cert)
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Certificado não encontrado</h1>
        <Link to="/certificados" className="link mt-4 inline-block">Meus certificados</Link>
      </div>
    )
  const date = new Date(cert.issued_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  const verifyUrl = `${window.location.origin}/validar/${cert.certificate_code}`
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="no-print mb-6 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>Imprimir ou salvar em PDF</button>
        <Link to="/certificados" className="btn btn-ghost">Todos os certificados</Link>
      </div>
      <section aria-label="Certificado" className="rounded-3xl border-8 border-double border-brand-500 bg-white p-8 text-center md:p-14">
        <Logo className="justify-center" />
        <p className="mt-10 text-lg">Certificamos que</p>
        <h1 className="mt-2 break-words text-4xl md:text-5xl">{cert.student_name}</h1>
        <p className="mx-auto mt-6 max-w-prose text-lg">
          concluiu com êxito o curso <strong>{cert.course_name}</strong>, cumprindo todas as aulas e a avaliação final.
        </p>
        <p className="mt-8">{date}</p>
        <div className="mt-10 border-t border-brand-100 pt-4 text-sm text-ink/70">
          <p>Código de verificação: <span className="font-mono">{cert.certificate_code}</span></p>
          <p className="break-all">Confira a autenticidade em {verifyUrl}</p>
        </div>
      </section>
    </div>
  )
}
