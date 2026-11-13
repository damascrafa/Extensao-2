import { describe, expect, it } from 'vitest'
import { certificateCodeSchema, feedbackSchema, fieldErrors, loginSchema, registerSchema } from './schemas'

const valid = {
  name: 'Ana',
  surname: 'Silva',
  birth_date: '',
  email: ' ANA@Teste.com ',
  password: 'senha1234',
  confirmPassword: 'senha1234',
}

describe('registerSchema', () => {
  it('aceita dados válidos e normaliza o e-mail', () => {
    const r = registerSchema.safeParse(valid)
    expect(r.success).toBe(true)
    expect(r.data.email).toBe('ana@teste.com')
  })
  it('rejeita senha curta, sem número ou sem letra', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'abc1', confirmPassword: 'abc1' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, password: 'somenteletras', confirmPassword: 'somenteletras' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, password: '12345678', confirmPassword: '12345678' }).success).toBe(false)
  })
  it('rejeita confirmação diferente', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: 'outra1234' })
    expect(r.success).toBe(false)
    expect(fieldErrors(r.error).confirmPassword).toBe('As senhas não conferem')
  })
  it('rejeita nome vazio, e-mail inválido e nascimento no futuro', () => {
    expect(registerSchema.safeParse({ ...valid, name: '  ' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, email: 'x' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, birth_date: '2999-01-01' }).success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('exige e-mail válido e senha', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true)
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false)
  })
})

describe('feedbackSchema', () => {
  it('aceita nota de 1 a 5 e limita a mensagem', () => {
    expect(feedbackSchema.safeParse({ rating: '5', message: 'ótimo' }).success).toBe(true)
    expect(feedbackSchema.safeParse({ rating: '0', message: '' }).success).toBe(false)
    expect(feedbackSchema.safeParse({ rating: '6', message: '' }).success).toBe(false)
    expect(feedbackSchema.safeParse({ rating: '3', message: 'a'.repeat(2001) }).success).toBe(false)
  })
})

describe('certificateCodeSchema', () => {
  it('aceita só UUID', () => {
    expect(certificateCodeSchema.safeParse('7b1f3c52-8d2e-4a0b-9c1d-123456789abc').success).toBe(true)
    expect(certificateCodeSchema.safeParse('abc').success).toBe(false)
  })
})
