// Testes do humor do pet: expressão do momento e falas sem cobrança.
import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({ supabase: {} }))

import { FALAS, contextoDoMomento, escolherFala, expressaoDoMomento, type Momento } from './humor'

const m = (x: Partial<Momento> = {}): Momento => ({
  feitos: 0, pendentes: 3, prioridadesAbertas: 0, prioridadesFeitas: 0, energiaBaixa: false, hora: 10, diaSemana: 3, ...x,
})

describe('expressão do pet', () => {
  it('segue o dia de verdade', () => {
    expect(expressaoDoMomento(m())).toBe('curioso')
    expect(expressaoDoMomento(m({ feitos: 1 }))).toBe('feliz')
    expect(expressaoDoMomento(m({ feitos: 3 }))).toBe('animado')
    expect(expressaoDoMomento(m({ feitos: 2, pendentes: 0 }))).toBe('orgulhoso')
    expect(expressaoDoMomento(m({ feitos: 1, prioridadesFeitas: 2, prioridadesAbertas: 0 }))).toBe('orgulhoso')
    expect(expressaoDoMomento(m({ energiaBaixa: true }))).toBe('tranquilo')
    expect(expressaoDoMomento(m({ hora: 23 }))).toBe('tranquilo')
    expect(expressaoDoMomento(m({ diaSemana: 0 }))).toBe('pensativo')
  })

  it('prioridades ainda abertas não contam como dia cumprido', () => {
    expect(expressaoDoMomento(m({ feitos: 1, prioridadesFeitas: 1, prioridadesAbertas: 1 }))).toBe('feliz')
  })

  it('o contexto da fala acompanha a expressão', () => {
    expect(contextoDoMomento(m())).toBe('comecar')
    expect(contextoDoMomento(m({ feitos: 1 }))).toBe('andamento')
    expect(contextoDoMomento(m({ feitos: 1, pendentes: 0 }))).toBe('completo')
    expect(contextoDoMomento(m({ energiaBaixa: true }))).toBe('descanso')
    expect(contextoDoMomento(m({ diaSemana: 1 }))).toBe('revisao')
  })
})

describe('falas do pet', () => {
  it('cada espécie tem falas próprias em todos os contextos', () => {
    for (const especie of ['broto', 'faisca', 'gota'] as const)
      for (const lista of Object.values(FALAS[especie])) expect(lista.length).toBeGreaterThanOrEqual(3)
    expect(FALAS.broto.comecar).not.toEqual(FALAS.faisca.comecar)
  })

  it('nenhuma fala cobra, culpa ou fala em tristeza', () => {
    const todas = Object.values(FALAS).flatMap((c) => Object.values(c).flat()).join(' ')
    expect(todas).not.toMatch(/faltou|deveria|atrasad|perdeu|decepc|triste|preguiç|culpa|abandon/i)
  })

  it('não repete a fala anterior', () => {
    const anterior = FALAS.gota.comecar[0]
    for (const sorteio of [0, 0.4, 0.99]) expect(escolherFala('gota', 'comecar', anterior, sorteio)).not.toBe(anterior)
  })
})
