// Testes do calendário: semana, itens de cada dia e repetições previstas.
import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { diasDaSemana, itensDoDia, outraSemana, totalDoDia } from './calendario'
import type { Compromisso } from './agenda'
import type { Serie } from './series'
import type { Tarefa } from './tarefas'

const c = (id: string, data: string, hora: string | null) => ({ id, data, hora, titulo: id }) as Compromisso
const t = (id: string, data: string | null, extra: Partial<Tarefa> = {}) => ({ id, data, ...extra }) as Tarefa
const serie = (id: string, dias: number[], inicio = '2026-11-01') =>
  ({ id, tipo: 'semanal', dias, dia_mes: null, inicio, titulo: id }) as unknown as Serie

describe('calendário', () => {
  it('monta a semana de segunda a domingo e navega entre semanas', () => {
    expect(diasDaSemana('2026-11-09')).toEqual([
      '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
    ])
    expect(outraSemana('2026-11-09', 1)).toBe('2026-11-16')
    expect(outraSemana('2026-11-09', -1)).toBe('2026-11-02')
  })

  it('separa o dia em "dia todo", blocos em ordem e tarefas', () => {
    const dados = {
      compromissos: [c('aula', '2026-11-13', '14:00:00'), c('prova', '2026-11-13', null), c('cedo', '2026-11-13', '08:00:00'), c('outro', '2026-11-14', null)],
      tarefas: [t('ler', '2026-11-13'), t('sem-data', null)],
      series: [],
    }
    const i = itensDoDia('2026-11-13', '2026-11-12', dados)
    expect(i.diaTodo.map((x) => x.id)).toEqual(['prova'])
    expect(i.blocos.map((x) => x.id)).toEqual(['cedo', 'aula'])
    expect(i.tarefas.map((x) => x.id)).toEqual(['ler'])
    expect(totalDoDia(i)).toBe(4)
  })

  it('mostra repetições previstas só em dias futuros e sem duplicar a tarefa já criada', () => {
    const hoje = '2026-11-12' // quinta
    const series = [serie('quinta-e-sexta', [4, 5]), serie('comeca-depois', [5], '2026-11-20')]
    const tarefas = [t('ja-criada', '2026-11-12', { series_id: 'quinta-e-sexta', ocorrencia: '2026-11-12' })]
    const dados = { compromissos: [], tarefas, series }
    expect(itensDoDia('2026-11-12', hoje, dados).previstas).toEqual([]) // hoje: a tarefa de verdade já existe
    expect(itensDoDia('2026-11-13', hoje, dados).previstas.map((s) => s.id)).toEqual(['quinta-e-sexta'])
    expect(itensDoDia('2026-11-20', hoje, dados).previstas.map((s) => s.id)).toEqual(['quinta-e-sexta', 'comeca-depois']) // sexta
    expect(itensDoDia('2026-11-19', hoje, dados).previstas.map((s) => s.id)).toEqual(['quinta-e-sexta']) // quinta, antes do início da outra
    expect(itensDoDia('2026-11-05', hoje, dados).previstas).toEqual([]) // passado: nada previsto
  })
})
