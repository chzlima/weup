// Testes da revisão espaçada: quando oferecer, como as revisões são montadas e o título.
import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { INTERVALOS_REVISAO, descreverRevisao, planejarRevisoes, podeOferecerRevisao, tituloRevisao } from './revisoes'
import type { Tarefa } from './tarefas'

const tarefa = (dados: Partial<Tarefa>) =>
  ({
    id: 't1', titulo: 'Fisiologia renal', dificuldade: 'complexa', categoria: 'estudo', project_id: null, data: null,
    concluida_em: null, created_at: '', series_id: null, ocorrencia: null, revisao_de: null, revisao_n: null,
    ...dados,
  }) as Tarefa

describe('revisão espaçada', () => {
  it('oferece só para tarefa de estudo que ainda não tem revisões', () => {
    const t = tarefa({})
    expect(podeOferecerRevisao(t, [t])).toBe(true)
    expect(podeOferecerRevisao(tarefa({ categoria: 'treino' }), [])).toBe(false)
    expect(podeOferecerRevisao(tarefa({ revisao_de: 'outra', revisao_n: 1 }), [])).toBe(false) // revisão não gera revisão
    expect(podeOferecerRevisao(t, [t, tarefa({ id: 'r1', revisao_de: 't1', revisao_n: 1 })])).toBe(false)
  })

  it('não oferece antes de o banco ter a coluna de revisões', () => {
    const semColuna = { id: 't1', titulo: 'x', categoria: 'estudo' } as Tarefa
    expect(podeOferecerRevisao(semColuna, [])).toBe(false)
  })

  it('agenda amanhã, em 7 e em 30 dias, como tarefas pequenas e avulsas', () => {
    const r = planejarRevisoes({ id: 't1', titulo: 'Fisiologia renal' }, new Date(2026, 10, 12))
    expect(INTERVALOS_REVISAO).toEqual([1, 7, 30])
    expect(r.map((x) => x.data)).toEqual(['2026-11-13', '2026-11-19', '2026-12-12'])
    expect(r.map((x) => x.revisao_n)).toEqual([1, 2, 3])
    expect(r.every((x) => x.revisao_de === 't1' && x.dificuldade === 'pequena' && x.project_id === null)).toBe(true)
    expect(r[0].titulo).toBe('Revisar: Fisiologia renal')
  })

  it('o título cabe no limite do banco e não repete o prefixo', () => {
    expect(tituloRevisao('x'.repeat(200))).toHaveLength(200)
    expect(tituloRevisao('Revisar: Anatomia')).toBe('Revisar: Anatomia')
  })

  it('descreve qual revisão é', () => {
    expect(descreverRevisao(tarefa({ revisao_de: 't0', revisao_n: 2 }))).toBe('revisão 2 de 3')
    expect(descreverRevisao(tarefa({}))).toBeUndefined()
  })
})
