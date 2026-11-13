import { describe, expect, it } from 'vitest'
import { friendlyError } from './errors'

describe('friendlyError', () => {
  it('traduz erros de negócio das RPCs', () => {
    expect(friendlyError({ message: 'lessons_incomplete' })).toMatch(/Conclua todas as aulas/)
    expect(friendlyError({ message: 'max_attempts_reached' })).toMatch(/tentativas/)
  })
  it('traduz erros do Auth', () => {
    expect(friendlyError({ message: 'Invalid login credentials' })).toBe('E-mail ou senha incorretos.')
  })
  it('usa a mensagem padrão para erros desconhecidos', () => {
    expect(friendlyError({ message: 'boom' }, 'padrão')).toBe('padrão')
  })
})
