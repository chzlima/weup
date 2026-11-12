// Testes do laço com o pet: níveis (iguais aos do banco) e a conversa sobre o dia.
import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({ supabase: {} }))

import { MINIMOS_LACO, assuntosDoDia, nivelDoLaco, progressoDoLaco } from './laco'
import { hojeISO, somarDias } from '../lib/tarefas'
import sqlDoLaco from '../../supabase/ciclo20-laco.sql?raw'

describe('laço', () => {
  it('sobe de nível pelos pontos mínimos', () => {
    expect(nivelDoLaco(0)).toBe(1)
    expect(nivelDoLaco(6)).toBe(1)
    expect(nivelDoLaco(7)).toBe(2)
    expect(nivelDoLaco(39)).toBe(3)
    expect(nivelDoLaco(400)).toBe(10)
    expect(nivelDoLaco(9999)).toBe(10)
  })

  it('o banco usa os mesmos pontos mínimos', () => {
    expect(sqlDoLaco).toContain(`array[${MINIMOS_LACO.join(', ')}]`)
  })

  it('mostra quanto falta para o próximo nível', () => {
    expect(progressoDoLaco(10)).toEqual({ nivel: 2, faltam: 10, fracao: 3 / 13 })
    expect(progressoDoLaco(400)).toEqual({ nivel: 10, faltam: null, fracao: 1 })
  })
})

describe('conversa com o pet', () => {
  it('fala de fatos do dia: compromisso, prioridade, prazo e o que já foi feito', () => {
    const a = assuntosDoDia({
      nomePessoa: 'Carlos',
      feitos: 3,
      proximoCompromisso: { titulo: 'Prova de anatomia', hora: '14:00:00', data: hojeISO() },
      prioridadeAberta: { titulo: 'Revisar renal' },
      prazoHoje: { titulo: 'Resumo' },
    })
    expect(a).toEqual([
      'Hoje tem Prova de anatomia às 14:00. Estou junto.',
      'Sua prioridade de hoje é "Revisar renal". Quer começar por ela?',
      'O prazo de "Resumo" é hoje. Um pedacinho já ajuda.',
      '3 coisas feitas hoje, Carlos! Eu vi tudo.',
    ])
  })

  it('compromisso de amanhã e dia sem nada', () => {
    expect(assuntosDoDia({ nomePessoa: 'Ana', feitos: 0, proximoCompromisso: { titulo: 'Plantão', hora: null, data: somarDias(1) } })[0]).toBe(
      'Amanhã tem Plantão. Que tal deixar algo pronto hoje?',
    )
    expect(assuntosDoDia({ nomePessoa: 'Ana', feitos: 0 })).toEqual(['Me conta, Ana: o que seria uma coisa pequena para hoje?'])
  })
})
