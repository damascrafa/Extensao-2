# Plataforma de cursos online

Plataforma de cursos com React + Vite + TypeScript e Supabase (Auth + PostgreSQL), hospedada na Vercel.

## Estado atual

| Parte | Situação |
|---|---|
| Banco, RLS, RPCs, seed (`supabase/`) | Escrito. **Não executado nem testado**: não havia PostgreSQL neste ambiente. |
| Testes pgTAP (`supabase/tests/`) | Escritos, **não executados**. |
| Documentação (`docs/`) | Pronta. |
| Esboço PHP original | Removido (substituído por Supabase + React). |
| Frontend React + Tailwind + JavaScript (`src/`) | Escrito. Sintaxe e resolução de todos os imports/exports validadas com um bundle esbuild; testes de schemas/lógica pura rodados com Node + zod. **`vite build` e `tailwindcss` (v3) não foram executados (sem rede), não aberto no navegador, não conectado a um Supabase real.** |

## Conectar ao Supabase (credenciais em branco por enquanto)

1. Crie um projeto novo em supabase.com. **Não reutilize o antigo**: a senha do `db.php` vazou no `.rar`.
2. Instale o Supabase CLI e, na raiz do projeto:
   ```bash
   supabase init            # gera supabase/config.toml (não apaga migrations)
   supabase link --project-ref <REF_DO_PROJETO>
   supabase db push         # aplica supabase/migrations/*
   ```
3. Opcional (dados de exemplo): rode `supabase/seed.sql` no SQL Editor (em ambiente local, `supabase db reset` já aplica).
4. Em *Authentication → Providers → Email*: ligue **Confirm email** e defina senha mínima de 8 caracteres.
5. Em *Authentication → URL Configuration*: defina *Site URL* e *Redirect URLs* (localhost e domínio da Vercel).
6. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Project Settings → API). **Só a chave anon.**
7. Torne-se admin (SQL Editor): ver `docs/security.md`.

## Rodar o frontend

```bash
npm install
cp .env.example .env.local   # preencha só VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
npm test                     # Vitest: schemas, erros e progresso
```

Sem as variáveis, o app mostra uma tela explicando o que falta (não exibe dados falsos).

## Testes de banco

```bash
supabase start
supabase test db
```

## Deploy na Vercel

1. Importe o repositório na Vercel (preset Vite: build `npm run build`, saída `dist`).
2. Em *Settings → Environment Variables*, cadastre as variáveis do `.env.example`.
3. `vercel.json` já faz o *rewrite* de SPA para o React Router.
4. Adicione a URL final em *Redirect URLs* do Supabase.

## Documentação

`docs/database.md` · `docs/backend.md` · `docs/security.md` · `docs/architecture.md`
