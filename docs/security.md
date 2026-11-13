# Segurança

## Modelo

1. **Privilégios mínimos (GRANT):** a migration `0003` revoga tudo de `anon`/`authenticated` e libera só o necessário, inclusive por coluna (`profiles`: só `name, surname, birth_date, avatar_url`; `feedback`: só `student_id, rating, message`).
2. **RLS em todas as tabelas** (16): define quais linhas cada papel vê.
3. **Escritas com regra de negócio só por RPC** `SECURITY DEFINER` com `search_path = ''`; a identidade vem de `auth.uid()`, nunca de parâmetro.
4. **Funções internas** (`_*`, `handle_new_user`, `set_updated_at`) sem `EXECUTE` para clientes.

## Matriz de acesso

| Dado | Visitante | Aluno | Admin |
|---|---|---|---|
| Cursos/módulos/aulas ativos | ler | ler | tudo |
| `profiles` | — | ler/editar o próprio (colunas limitadas) | ler todos |
| `enrollments`, `lesson_progress`, `exercise_attempts`, `exam_attempts`, `certificates` | — | **ler só os próprios**; escrever só via RPC | ler todos |
| Prova (questões/alternativas) | — | ler se matriculado | tudo |
| `exam_answer_keys` (gabarito) | — | **nenhum acesso** | tudo |
| `user_roles` | — | ler o próprio | **só service_role/SQL** |
| `feedback` | ler `public_feedbacks` | inserir e ler os próprios | moderar |
| Validar certificado | `verify_certificate(uuid)` | idem | idem |

## Requisitos do prompt → como são atendidos

| Requisito | Mecanismo |
|---|---|
| Aluno não altera nota/aprovação | `exam_attempts` sem INSERT/UPDATE para clientes; só `submit_exam` grava |
| Aluno não emite certificado | `certificates` sem INSERT; `issue_certificate` revalida tudo |
| Não virar admin editando o perfil | Papéis em `user_roles` (sem grant de escrita); `is_admin()` ignora o metadata do usuário |
| Não confiar em IDs do cliente | `student_id` sempre `auth.uid()` dentro das RPCs |
| `service_role` fora do frontend | Só existe a chave `anon` no `.env`; o `service_role` nunca entra no repositório nem no bundle |
| Ver dados de outro aluno → negado | Policies `*_select_own`; coberto por `supabase/tests/rls_and_rules.test.sql` |

## Tornar alguém admin

Somente pelo SQL Editor do Supabase (ou service_role), nunca pelo app:

```sql
insert into public.user_roles (user_id, role)
values ('<uuid do usuário em auth.users>', 'admin');
```

## Validação de dados

- **Banco**: `CHECK`s (faixas, regex de `slug` e `content_path`, status válidos), FKs, `UNIQUE`s, limites de tamanho para JSON.
- **Frontend**: Zod em todos os formulários (cadastro, login, feedback) para UX. É conveniência, a garantia está no banco.
- **Senhas**: gerenciadas só pelo Supabase Auth. Definir política mínima (≥ 8 caracteres) em *Authentication → Providers → Email*.

## Limites conhecidos (leia)

1. **O conteúdo das aulas não é secreto.** Os módulos JS fazem parte do bundle servido pela Vercel; qualquer pessoa pode baixá-los. O banco protege *progresso, prova e certificado*, não o sigilo do conteúdo. Para um curso gratuito isso é aceitável. Para conteúdo pago seria preciso servir o conteúdo por Storage com URL assinada ou por Edge Function.
2. **Exercícios são formativos**: o resultado vem do navegador e pode ser forjado; por isso não entra em nota.
3. **Aluno pode concluir aulas sem assisti-las**: `complete_lesson` registra a ação, não verifica atenção. A prova final é a garantia de aprendizado.
4. **Spam de feedback**: não há limite de taxa. Considerar um limite por usuário/dia.
5. **A view `public_feedbacks`** executa com direitos do dono (padrão do Postgres) para poder ler `profiles`; expõe só primeiro nome, nota, texto e data de feedbacks aprovados. O linter do Supabase pode avisar sobre isso; é intencional.
6. **Exclusão de conta (LGPD)**: `RESTRICT` protege o histórico, mas impede apagar usuário com matrícula. Falta a rotina de anonimização (a implementar).
7. **Prova mal configurada** (questão sem gabarito) é recusada com `exam_misconfigured`; ainda assim, o painel admin futuro deve exigir uma alternativa correta por questão.
8. **Rate limiting de login/cadastro**: usar os limites do Supabase Auth e considerar CAPTCHA (Turnstile/hCaptcha) no cadastro.

## Segredos

- `.env` fica no `.gitignore`; só `.env.example` (nomes) é versionado.
- O `config/db.php` do esboço original continha a senha do banco em texto puro. **Troque essa senha** (*Project Settings → Database → Reset database password*) e não reaproveite o projeto antigo sem isso.
