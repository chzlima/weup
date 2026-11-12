// Testes dos lembretes: quais avisos existem hoje, quando chegam e o texto do aviso.
import { describe, expect, it } from 'vitest'
import { descreverAviso, lembretesDoDia, lembretesPendentes } from './lembretes'
import type { Compromisso } from './agenda'
import type { Tarefa } from './tarefas'

const HOJE = '2026-11-12'
const c = (id: string, data: string, hora: string | null, lembrete_min: number | null) =>
  ({ id, titulo: `C ${id}`, data, hora, lembrete_min }) as Compromisso
const t = (id: string, data: string | null, lembrete: string | null, feita = false) =>
  ({ id, titulo: `T ${id}`, data, lembrete, concluida_em: feita ? 'x' : null }) as Tarefa
const as = (hora: string) => new Date(2026, 10, 12, ...hora.split(':').map(Number)).getTime()

describe('lembretes', () => {
  const compromissos = [
    c('aula', HOJE, '14:00:00', 30),
    c('sem-aviso', HOJE, '09:00:00', null),
    c('dia-todo', HOJE, null, 10),
    c('amanha', '2026-11-13', '08:00:00', 0),
    c('agora', HOJE, '07:15:00', 0),
  ]
  const tarefas = [t('ler', HOJE, '20:00:00'), t('feita', HOJE, '06:00:00', true), t('sem-dia', null, '10:00:00'), t('sem-hora', HOJE, null)]

  it('só entram os de hoje, com horário e aviso, em ordem', () => {
    const lista = lembretesDoDia(compromissos, tarefas, HOJE)
    expect(lista.map((l) => l.titulo)).toEqual(['C agora', 'C aula', 'T ler'])
    expect(lista[1].quando).toBe(as('13:30'))
    expect(lista[1].detalhe).toBe('Às 14:00 · compromisso')
    expect(lista[0].detalhe).toBe('Agora · 07:15')
    expect(lista[2].detalhe).toBe('Tarefa de hoje · 20:00')
  })

  it('aparecem quando chega a hora e somem depois de vistos', () => {
    const lista = lembretesDoDia(compromissos, tarefas, HOJE)
    expect(lembretesPendentes(lista, as('07:00'), new Set())).toEqual([])
    expect(lembretesPendentes(lista, as('13:30'), new Set()).map((l) => l.titulo)).toEqual(['C agora', 'C aula'])
    const vistos = new Set([lista[0].chave])
    expect(lembretesPendentes(lista, as('21:00'), vistos).map((l) => l.titulo)).toEqual(['C aula', 'T ler'])
  })

  it('mudar o horário cria um aviso novo (o visto antigo não vale)', () => {
    const antes = lembretesDoDia([c('aula', HOJE, '14:00:00', 30)], [], HOJE)[0].chave
    const depois = lembretesDoDia([c('aula', HOJE, '15:00:00', 30)], [], HOJE)[0].chave
    expect(antes).not.toBe(depois)
  })

  it('descreve o aviso', () => {
    expect(descreverAviso(null)).toBeNull()
    expect(descreverAviso(0)).toBe('na hora')
    expect(descreverAviso(60)).toBe('1 hora antes')
    expect(descreverAviso(45)).toBe('45 min antes')
  })
})
