// Testes do modo prova: leitura dos assuntos, distribuição do estudo e contagem regressiva.
import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { contagemRegressiva, distribuirEstudo, lerAssuntos, progressoDaProva, proximasProvas, type Prova } from './provas'
import type { Tarefa } from './tarefas'

const HOJE = '2026-11-12' // quinta

describe('modo prova', () => {
  it('lê um assunto por linha, sem vazios nem repetidos', () => {
    expect(lerAssuntos('Cardio\n\n  Pneumo  \ncardio\nRenal, Endócrino; Gastro')).toEqual([
      'Cardio', 'Pneumo', 'Renal', 'Endócrino', 'Gastro',
    ])
    expect(lerAssuntos('   \n ,, ')).toEqual([])
  })

  it('espalha os assuntos até a antevéspera e deixa a véspera para a revisão geral', () => {
    // Prova dia 20: 8 dias de estudo (12 a 19). Véspera (19) = revisão; assuntos em 12 a 18.
    const plano = distribuirEstudo('2026-11-20', ['A', 'B', 'C', 'D'], HOJE)
    expect(plano).toEqual([
      { titulo: 'Estudar A', data: '2026-11-12' },
      { titulo: 'Estudar B', data: '2026-11-13' },
      { titulo: 'Estudar C', data: '2026-11-15' },
      { titulo: 'Estudar D', data: '2026-11-17' },
      { titulo: 'Revisão geral', data: '2026-11-19' },
    ])
  })

  it('com mais assuntos que dias, junta mais de um por dia', () => {
    const plano = distribuirEstudo('2026-11-15', ['A', 'B', 'C', 'D', 'E'], HOJE) // estudo 12, 13; revisão 14
    expect(plano.map((e) => e.data)).toEqual(['2026-11-12', '2026-11-12', '2026-11-12', '2026-11-13', '2026-11-13', '2026-11-14'])
  })

  it('prova amanhã: tudo hoje, sem revisão separada', () => {
    expect(distribuirEstudo('2026-11-13', ['A', 'B'], HOJE)).toEqual([
      { titulo: 'Estudar A', data: HOJE },
      { titulo: 'Estudar B', data: HOJE },
    ])
  })

  it('recusa prova hoje ou no passado, lista vazia e assuntos demais', () => {
    expect(() => distribuirEstudo(HOJE, ['A'], HOJE)).toThrow('depois de hoje')
    expect(() => distribuirEstudo('2026-11-01', ['A'], HOJE)).toThrow('depois de hoje')
    expect(() => distribuirEstudo('2026-11-20', [], HOJE)).toThrow('pelo menos um')
    expect(() => distribuirEstudo('2026-11-20', Array.from({ length: 16 }, (_, i) => `${i}`), HOJE)).toThrow('No máximo 15')
  })

  it('contagem regressiva', () => {
    expect(contagemRegressiva('2026-11-20', HOJE)).toBe('Faltam 8 dias')
    expect(contagemRegressiva('2026-11-13', HOJE)).toBe('A prova é amanhã')
    expect(contagemRegressiva(HOJE, HOJE)).toBe('A prova é hoje. Boa prova! 🍀')
    expect(contagemRegressiva('2026-11-10', HOJE)).toBe('A prova já passou')
  })

  it('próximas provas e progresso', () => {
    const p = (id: string, data: string) => ({ id, titulo: id, data, created_at: '' }) as Prova
    expect(proximasProvas([p('b', '2026-12-01'), p('velha', '2026-11-01'), p('a', HOJE)], HOJE).map((x) => x.id)).toEqual(['a', 'b'])
    const t = (exam_id: string, feita: boolean) => ({ exam_id, concluida_em: feita ? 'x' : null }) as Tarefa
    expect(progressoDaProva({ id: 'a' }, [t('a', true), t('a', false), t('b', true)])).toEqual({ feitas: 1, total: 2 })
  })
})
