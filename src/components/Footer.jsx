import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="no-print mt-16 bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo className="text-white [&_span>span]:text-sun" />
          <p className="mt-3 text-white/75">
            Projeto educacional sem fins lucrativos, alinhado ao ODS 4 (Educação de Qualidade) da ONU.
          </p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-col gap-2">
          <Link to="/#cursos" className="hover:underline">Cursos gratuitos</Link>
          <Link to="/#sobre" className="hover:underline">Sobre o projeto</Link>
          <Link to="/validar" className="hover:underline">Validar certificado</Link>
          <Link to="/feedback" className="hover:underline">Enviar feedback</Link>
        </nav>
      </div>
      <p className="border-t border-white/15 px-4 py-4 text-center text-sm text-white/70">
        © {new Date().getFullYear()} Primeiro Clique. Todos os direitos reservados.
      </p>
    </footer>
  )
}
