// Testes do modelo de agenda: horário de fim, blocos que atravessam a meia-noite e prazo das tarefas.
import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { descreverFim, duracaoMinutos, validarHorario, type Compromisso } from './agenda'
import { descreverPrazo } from './tarefas'

const c = (hora: string | null, hora_fim: string | null = null) => ({ hora, hora_fim }) as Compromisso

describe('blocos de horário', () => {
  it('calcula a duração, inclusive atravessando a meia-noite', () => {
    expect(duracaoMinutos('08:00', '10:30')).toBe(150)
    expect(duracaoMinutos('19:00:00', '07:00:00')).toBe(720) // plantão noturno
    expect(duracaoMinutos('23:30', '00:15')).toBe(45)
    expect(duracaoMinutos(null, '10:00')).toBeNull()
    expect(duracaoMinutos('08:00', null)).toBeNull()
  })

  it('descreve até quando vai o bloco', () => {
    expect(descreverFim(c('08:00:00', '10:00:00'))).toBe('até 10:00')
    expect(descreverFim(c('19:00:00', '07:00:00'))).toBe('até 07:00 do dia seguinte')
    expect(descreverFim(c('08:00:00'))).toBeNull()
    expect(descreverFim(c(null))).toBeNull()
  })

  it('não aceita fim sem início nem fim igual ao início', () => {
    expect(validarHorario('08:00', '10:00')).toBe('')
    expect(validarHorario('19:00', '07:00')).toBe('')
    expect(validarHorario('', '')).toBe('')
    expect(validarHorario('08:00', '')).toBe('')
    expect(validarHorario('', '10:00')).toMatch(/início/)
    expect(validarHorario('08:00', '08:00')).toMatch(/diferente/)
  })
})

describe('prazo das tarefas', () => {
  const hoje = '2026-11-12'
  it('diz quando vence, sem tom de cobrança', () => {
    expect(descreverPrazo('2026-11-12', hoje)).toBe('prazo hoje')
    expect(descreverPrazo('2026-11-13', hoje)).toBe('prazo amanhã')
    expect(descreverPrazo('2026-11-15', hoje)).toBe('prazo em 3 dias')
    expect(descreverPrazo('2026-12-01', hoje)).toMatch(/^prazo 1 de dez/)
    expect(descreverPrazo('2026-11-10', hoje)).toMatch(/^o prazo era 10 de nov/)
  })
})
