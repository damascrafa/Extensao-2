import { describe, expect, it } from 'vitest'
import { buildCurriculum, minutesLabel, neighbors, pickResumeLesson } from './progress'

const course = {
  modules: [
    { id: 'm2', title: 'B', order_index: 2, lessons: [{ id: 'l3', order_index: 1, is_active: true }] },
    {
      id: 'm1',
      title: 'A',
      order_index: 1,
      lessons: [
        { id: 'l2', order_index: 2, is_active: true },
        { id: 'l1', order_index: 1, is_active: true },
        { id: 'lx', order_index: 3, is_active: false },
      ],
    },
  ],
}

describe('buildCurriculum', () => {
  it('ordena módulos e aulas e ignora aulas inativas', () => {
    const { flat } = buildCurriculum(course)
    expect(flat.map((l) => l.id)).toEqual(['l1', 'l2', 'l3'])
    expect(flat[2].moduleTitle).toBe('B')
  })
  it('lida com curso vazio', () => {
    expect(buildCurriculum(null).flat).toEqual([])
  })
})

describe('neighbors', () => {
  const { flat } = buildCurriculum(course)
  it('devolve anterior e próxima', () => {
    expect(neighbors(flat, 'l2').prev.id).toBe('l1')
    expect(neighbors(flat, 'l2').next.id).toBe('l3')
    expect(neighbors(flat, 'l1').prev).toBeNull()
    expect(neighbors(flat, 'l3').next).toBeNull()
  })
})

describe('pickResumeLesson', () => {
  const { flat } = buildCurriculum(course)
  it('prefere a última acessada', () => expect(pickResumeLesson(flat, 'l2').id).toBe('l2'))
  it('senão, a primeira não concluída', () => expect(pickResumeLesson(flat, null, new Set(['l1'])).id).toBe('l2'))
  it('senão, a primeira', () => expect(pickResumeLesson(flat, null, new Set(['l1', 'l2', 'l3'])).id).toBe('l1'))
})

describe('minutesLabel', () => {
  it('formata minutos e horas', () => {
    expect(minutesLabel(21)).toBe('21 min')
    expect(minutesLabel(60)).toBe('1 h')
    expect(minutesLabel(135)).toBe('2 h 15 min')
  })
})
