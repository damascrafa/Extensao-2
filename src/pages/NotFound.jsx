import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-4xl">Página não encontrada</h1>
      <p className="mt-3 text-ink/75">O endereço pode ter mudado ou estar digitado errado.</p>
      <Link to="/" className="btn btn-primary mt-6">Voltar ao início</Link>
    </div>
  )
}
