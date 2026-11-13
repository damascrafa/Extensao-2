const MESSAGES = {
  not_authenticated: 'Você precisa entrar para continuar.',
  not_enrolled: 'Você ainda não está matriculado neste curso.',
  course_not_available: 'Este curso não está disponível.',
  lesson_not_found: 'Aula não encontrada.',
  lessons_incomplete: 'Conclua todas as aulas antes de continuar.',
  exam_not_passed: 'É preciso ser aprovado na avaliação final.',
  already_approved: 'Você já foi aprovado nesta avaliação.',
  max_attempts_reached: 'Você usou todas as tentativas desta avaliação.',
  invalid_answers: 'Respostas inválidas. Recarregue a página e tente de novo.',
  exam_misconfigured: 'Esta avaliação ainda não está pronta. Avise a equipe.',
  exam_not_found: 'Avaliação não encontrada.',
  answer_too_large: 'A resposta enviada é grande demais.',
}

const AUTH_PATTERNS = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'],
  [/user already registered/i, 'Este e-mail já tem cadastro. Tente entrar.'],
  [/password should be at least/i, 'A senha é curta demais.'],
  [/rate limit|too many requests/i, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'],
  [/failed to fetch|network/i, 'Sem conexão com o servidor. Verifique sua internet.'],
]

export function friendlyError(error, fallback = 'Algo deu errado. Tente novamente.') {
  const raw = (error && (error.message || String(error))) || ''
  if (MESSAGES[raw]) return MESSAGES[raw]
  for (const [pattern, text] of AUTH_PATTERNS) if (pattern.test(raw)) return text
  return fallback
}
