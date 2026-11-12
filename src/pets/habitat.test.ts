// Testes do habitat: hora do dia, versão da cena e decorações das conquistas.
import { describe, expect, it } from 'vitest'
import { decoracoesDe, nivelDoHabitat, periodoDoDia } from './habitat'

describe('habitat', () => {
  it('muda a luz com a hora do dia', () => {
    expect([5, 11, 12, 17, 18, 23, 0, 4].map(periodoDoDia)).toEqual([
      'manha', 'manha', 'tarde', 'tarde', 'noite', 'noite', 'noite', 'noite',
    ])
  })

  it('tem três versões da cena conforme o estágio', () => {
    expect([1, 2, 3, 4, 5].map((e) => nivelDoHabitat(e as 1 | 2 | 3 | 4 | 5))).toEqual([1, 1, 2, 3, 3])
  })

  it('as decorações aparecem pelas memórias do diário', () => {
    expect(decoracoesDe(['pet', 'primeira_tarefa'])).toEqual([])
    expect(decoracoesDe(['revisao_1', 'primeira_habito', 'laco_2'])).toEqual(['vaso', 'lanterna', 'almofada'])
  })
})
