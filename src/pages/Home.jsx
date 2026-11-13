import { Link } from 'react-router-dom'
import ClickDemo from '../components/ClickDemo'
import CourseCard from '../components/CourseCard'
import { EmptyState, ErrorState, Spinner } from '../components/Feedback'
import { useCourses, usePublicFeedbacks } from '../hooks/queries'
import { useAuthStore } from '../store/authStore'

function Courses() {
  const { data, isLoading, error, refetch } = useCourses()
  if (isLoading) return <Spinner label="Carregando cursos…" />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!data.length)
    return <EmptyState title="Os cursos serão publicados em breve">Volte aqui em alguns dias.</EmptyState>
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </div>
  )
}

function Testimonials() {
  const { data } = usePublicFeedbacks()
  if (!data?.length) return null
  return (
    <section aria-labelledby="depoimentos" className="mx-auto max-w-6xl px-4 pt-16">
      <h2 id="depoimentos" className="text-3xl">O que os alunos dizem</h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {data.map((f) => (
          <li key={f.id} className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
            <p aria-label={`Nota ${f.rating} de 5`} className="font-bold text-brand-600">
              {'★'.repeat(f.rating)}
              <span className="text-brand-100">{'★'.repeat(5 - f.rating)}</span>
            </p>
            <p className="mt-2">{f.message}</p>
            <p className="mt-3 text-sm font-bold text-ink/70">{f.author_first_name}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Home() {
  const session = useAuthStore((s) => s.session)
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
        <div>
          <h1 className="text-4xl md:text-6xl">Todo aprendizado começa com um clique.</h1>
          <p className="mt-5 max-w-prose text-xl text-ink/80">
            Curso de informática básica, gratuito, para quem está dando os primeiros passos no computador.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {session ? (
              <Link to="/painel" className="btn btn-primary">Ir para o meu painel</Link>
            ) : (
              <>
                <Link to="/cadastro" className="btn btn-primary">Criar conta gratuita</Link>
                <Link to="/login" className="btn btn-ghost">Já tenho conta</Link>
              </>
            )}
          </div>
        </div>
        <ClickDemo />
      </section>

      <section id="cursos" aria-labelledby="cursos-titulo" className="mx-auto max-w-6xl scroll-mt-20 px-4">
        <h2 id="cursos-titulo" className="mb-6 text-3xl">Cursos gratuitos</h2>
        <Courses />
      </section>

      <Testimonials />

      <section id="sobre" aria-labelledby="sobre-titulo" className="mx-auto mt-16 max-w-6xl scroll-mt-20 px-4">
        <div className="rounded-3xl bg-white p-8 ring-1 ring-brand-100 md:p-12">
          <h2 id="sobre-titulo" className="max-w-2xl text-3xl">Educação de qualidade, aberta a todos</h2>
          <div className="mt-5 max-w-prose space-y-4 text-ink/85">
            <p>
              O Primeiro Clique é um projeto educacional sem fins lucrativos, criado para contribuir com a Educação de
              Qualidade (ODS 4), um dos Objetivos de Desenvolvimento Sustentável da ONU.
            </p>
            <p>
              Oferecemos, de graça, um curso básico de informática: computador, teclado e mouse, internet, ferramentas
              digitais e segurança básica, explicados de forma simples.
            </p>
            <p>
              Escolhemos o nome porque todo aprendizado começa com uma primeira ação. Para muita gente, esse clique é o
              início de uma nova oportunidade.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
