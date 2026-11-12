// Testes da revisão semanal: qual semana revisar, textos e a carta do pet.
import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import {
  cartaDoPet, descreverSemana, diaDeRevisar, fimDaSemana, formatarMinutos, segundaDaSemana, semanaRevisada, type Fatos,
} from './revisaoSemanal'

const fatos = (f: Partial<Fatos> = {}): Fatos => ({
  tarefas: 0, habitos: 0, sessoesFoco: 0, minutosFoco: 0, xp: 0, diasEnergiaBaixa: 0, recomecos: 0, ...f,
})

describe('semana da revisão', () => {
  it('acha a segunda-feira de qualquer dia (12/11/2026 é quinta)', () => {
    expect(segundaDaSemana('2026-11-12')).toBe('2026-11-09')
    expect(segundaDaSemana('2026-11-09')).toBe('2026-11-09')
    expect(segundaDaSemana('2026-11-15')).toBe('2026-11-09') // domingo é o fim da semana
    expect(segundaDaSemana('2027-01-01')).toBe('2026-12-28') // atravessa o ano
    expect(fimDaSemana('2026-11-09')).toBe('2026-11-15')
  })

  it('no domingo revisa a semana que termina; na segunda, a que acabou ontem', () => {
    expect(semanaRevisada('2026-11-15')).toBe('2026-11-09') // domingo
    expect(semanaRevisada('2026-11-16')).toBe('2026-11-09') // segunda
    expect(semanaRevisada('2026-11-12')).toBe('2026-11-09') // quinta: a semana até agora
    expect(diaDeRevisar('2026-11-15')).toBe(true)
    expect(diaDeRevisar('2026-11-16')).toBe(true)
    expect(diaDeRevisar('2026-11-12')).toBe(false)
  })

  it('escreve a semana e os minutos de um jeito curto', () => {
    expect(descreverSemana('2026-11-09')).toBe('9 a 15 de nov')
    expect(descreverSemana('2026-11-30')).toBe('30 de nov a 6 de dez')
    expect(formatarMinutos(45)).toBe('45 min')
    expect(formatarMinutos(75)).toBe('1 h 15 min')
    expect(formatarMinutos(120)).toBe('2 h')
  })
})

describe('carta do pet', () => {
  it('reconhece o que aconteceu, com plural certo', () => {
    const carta = cartaDoPet(fatos({ tarefas: 1, habitos: 5, minutosFoco: 75 }), 'Carlos', 'Gota')
    expect(carta[0]).toBe('Oi, Carlos!')
    expect(carta[1]).toBe('Nesta semana você teve 1 tarefa concluída, hábitos feitos 5 vezes e 1 h 15 min de foco. Cada uma dessas coisas contou.')
    expect(carta[carta.length - 1]).toBe('— Gota')
  })

  it('semana sem registros é acolhida, nunca cobrada', () => {
    const carta = cartaDoPet(fatos(), 'Ana', 'Broto').join(' ')
    expect(carta).toContain('mais quieta')
    expect(carta).toContain('Descansar também faz parte')
    expect(carta).not.toMatch(/faltou|deveria|atrasad|perdeu/i)
  })

  it('menciona energia baixa e recomeços como cuidado', () => {
    const carta = cartaDoPet(fatos({ tarefas: 2, diasEnergiaBaixa: 2, recomecos: 1 }), 'Ana', 'Faísca').join(' ')
    expect(carta).toContain('respeitou o seu ritmo')
    expect(carta).toContain('recomeçou 1 vez')
  })
})
