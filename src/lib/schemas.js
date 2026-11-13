import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Informe um e-mail válido')

const password = z
  .string()
  .min(8, 'Use ao menos 8 caracteres')
  .regex(/[A-Za-z]/, 'Inclua ao menos uma letra')
  .regex(/\d/, 'Inclua ao menos um número')

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe seu nome').max(100, 'Nome muito longo'),
    surname: z.string().trim().min(1, 'Informe seu sobrenome').max(100, 'Sobrenome muito longo'),
    birth_date: z
      .string()
      .optional()
      .refine((v) => !v || (!Number.isNaN(Date.parse(v)) && new Date(v) <= new Date()), 'Data inválida'),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha'),
})

export const emailSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

export const feedbackSchema = z.object({
  rating: z.coerce.number({ invalid_type_error: 'Escolha uma nota' }).int().min(1, 'Escolha uma nota').max(5),
  message: z.string().trim().max(2000, 'Máximo de 2000 caracteres'),
})

export const certificateCodeSchema = z.string().trim().uuid('Código inválido')

// Converte um erro do Zod em { campo: 'mensagem' } (primeira mensagem de cada campo).
export function fieldErrors(zodError) {
  const out = {}
  for (const issue of zodError.issues) {
    const key = issue.path[0] ?? '_'
    if (!out[key]) out[key] = issue.message
  }
  return out
}
