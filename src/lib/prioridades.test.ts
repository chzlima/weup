// Testes das prioridades do dia e do "prazo chegando".
import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { alternarPrioridade, moverPrioridade, prazoChegando, separarPrioridades } from './prioridades'
import type { Tarefa } from './tarefas'

const t = (id: string, extra: Partial<Tarefa> = {}) => ({ id, data: null, prazo: null, concluida_em: null, ...extra }) as Tarefa

describe('prioridades do dia', () => {
  it('marca até 3 e desmarca com o mesmo toque', () => {
    expect(alternarPrioridade([], 'a')).toEqual(['a'])
    expect(alternarPrioridade(['a', 'b'], 'c')).toEqual(['a', 'b', 'c'])
    expect(alternarPrioridade(['a', 'b', 'c'], 'd')).toEqual(['a', 'b', 'c']) // já tem 3
    expect(alternarPrioridade(['a', 'b', 'c'], 'b')).toEqual(['a', 'c'])
  })

  it('sobe e desce na ordem, sem passar das pontas', () => {
    expect(moverPrioridade(['a', 'b', 'c'], 'c', -1)).toEqual(['a', 'c', 'b'])
    expect(moverPrioridade(['a', 'b', 'c'], 'a', 1)).toEqual(['b', 'a', 'c'])
    expect(moverPrioridade(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c'])
    expect(moverPrioridade(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c'])
    expect(moverPrioridade(['a'], 'x', 1)).toEqual(['a'])
  })

  it('separa as prioridades na ordem escolhida e ignora as que saíram do dia', () => {
    const dia = [t('a'), t('b'), t('c'), t('d')]
    const r = separarPrioridades(dia, ['c', 'sumiu', 'a'])
    expect(r.prioridades.map((x) => x.id)).toEqual(['c', 'a'])
    expect(r.resto.map((x) => x.id)).toEqual(['b', 'd'])
  })
})

describe('prazo chegando', () => {
  const hoje = '2026-11-12'
  it('mostra o que vence até amanhã e ainda não está planejado para hoje', () => {
    const lista = [
      t('sem-data-vence-amanha', { prazo: '2026-11-13' }),
      t('planejada-depois-vence-hoje', { data: '2026-11-20', prazo: '2026-11-12' }),
      t('ja-passou', { prazo: '2026-11-10' }),
      t('planejada-hoje', { data: hoje, prazo: hoje }), // já aparece na lista do dia
      t('vence-depois', { prazo: '2026-11-20' }),
      t('feita', { prazo: hoje, concluida_em: '2026-11-11T10:00:00Z' }),
    ]
    expect(prazoChegando(lista, hoje).map((x) => x.id)).toEqual([
      'ja-passou', 'planejada-depois-vence-hoje', 'sem-data-vence-amanha',
    ])
  })
})
