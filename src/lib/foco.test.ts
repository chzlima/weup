// Testes do foco: duração livre e tempo restante com pausas.
import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { lerDuracao, tempoRestanteMs } from './foco'

const inicio = '2026-11-12T10:00:00Z'
const em = (min: number) => Date.parse(inicio) + min * 60_000
const sessao = (extra: { pausada_em?: string | null; pausa_segundos?: number } = {}) => ({
  minutos: 25, inicio, pausada_em: null, pausa_segundos: 0, ...extra,
})

describe('foco', () => {
  it('aceita duração inteira de 5 a 120 minutos', () => {
    expect(lerDuracao('30')).toBe(30)
    expect(lerDuracao('5')).toBe(5)
    expect(lerDuracao('120')).toBe(120)
    expect(lerDuracao('4')).toBeNull()
    expect(lerDuracao('121')).toBeNull()
    expect(lerDuracao('12.5')).toBeNull()
    expect(lerDuracao('')).toBeNull()
  })

  it('conta o tempo que falta sem pausas', () => {
    expect(tempoRestanteMs(sessao(), em(0))).toBe(25 * 60_000)
    expect(tempoRestanteMs(sessao(), em(10))).toBe(15 * 60_000)
    expect(tempoRestanteMs(sessao(), em(40))).toBe(0)
  })

  it('o tempo pausado não conta', () => {
    // pausou 5 minutos antes e agora está aos 20 minutos do início
    expect(tempoRestanteMs(sessao({ pausa_segundos: 300 }), em(20))).toBe(10 * 60_000)
  })

  it('pausada, o restante fica congelado no momento da pausa', () => {
    const pausada = sessao({ pausada_em: new Date(em(10)).toISOString() })
    expect(tempoRestanteMs(pausada, em(10))).toBe(15 * 60_000)
    expect(tempoRestanteMs(pausada, em(90))).toBe(15 * 60_000) // horas depois, continua igual
  })

  it('nunca passa da duração, mesmo com relógio adiantado', () => {
    expect(tempoRestanteMs(sessao(), em(-5))).toBe(25 * 60_000)
  })
})
