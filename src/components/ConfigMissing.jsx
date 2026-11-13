import Logo from './Logo'

export default function ConfigMissing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-6">
      <Logo />
      <h1 className="text-3xl">Falta conectar o Supabase</h1>
      <p>
        Crie o arquivo <code className="rounded bg-brand-50 px-1">.env.local</code> a partir do{' '}
        <code className="rounded bg-brand-50 px-1">.env.example</code> e preencha{' '}
        <code className="rounded bg-brand-50 px-1">VITE_SUPABASE_URL</code> e{' '}
        <code className="rounded bg-brand-50 px-1">VITE_SUPABASE_ANON_KEY</code>. Depois, reinicie o{' '}
        <code className="rounded bg-brand-50 px-1">npm run dev</code>.
      </p>
      <p className="text-ink/70">Nenhum dado de exemplo é exibido enquanto a conexão não existir.</p>
    </main>
  )
}
