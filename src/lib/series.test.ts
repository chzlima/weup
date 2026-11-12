// Testes das tarefas que se repetem: em que dias a regra cai, a próxima ocorrência e o texto que descreve a regra.
import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import {
  descreverRegra, limparRegra, ocorrenciasEntre, proximaOcorrencia, serieCaiEm, validarRegra, type Regra,
} from './series'
import regraDoBanco from '../../supabase/ciclo12-recorrencia.sql?raw'

const diaria: Regra = { tipo: 'diaria', dias: null, dia_mes: null }
const semanal = (...dias: number[]): Regra => ({ tipo: 'semanal', dias, dia_mes: null })
const mensal = (dia_mes: number): Regra => ({ tipo: 'mensal', dias: null, dia_mes })

describe('em que dias a repetição cai', () => {
  it('diária cai todo dia', () => {
    expect(serieCaiEm(diaria, '2026-11-11')).toBe(true)
    expect(serieCaiEm(diaria, '2028-02-29')).toBe(true)
  })

  it('semanal cai só nos dias escolhidos (11/11/2026 é quarta)', () => {
    expect(serieCaiEm(semanal(1, 3), '2026-11-11')).toBe(true)
    expect(serieCaiEm(semanal(1, 3), '2026-11-09')).toBe(true)
    expect(serieCaiEm(semanal(1, 3), '2026-11-10')).toBe(false)
    expect(serieCaiEm(semanal(0), '2026-11-15')).toBe(true)
  })

  it('mensal cai no dia escolhido', () => {
    expect(serieCaiEm(mensal(5), '2026-11-05')).toBe(true)
    expect(serieCaiEm(mensal(5), '2026-11-06')).toBe(false)
  })

  it('mensal no dia 31 cai no último dia dos meses mais curtos', () => {
    expect(serieCaiEm(mensal(31), '2026-11-30')).toBe(true)
    expect(serieCaiEm(mensal(31), '2026-11-29')).toBe(false)
    expect(serieCaiEm(mensal(31), '2026-12-31')).toBe(true)
    expect(serieCaiEm(mensal(31), '2026-12-30')).toBe(false)
    expect(serieCaiEm(mensal(30), '2026-02-28')).toBe(true)
    expect(serieCaiEm(mensal(29), '2028-02-29')).toBe(true) // ano bissexto
    expect(serieCaiEm(mensal(29), '2027-02-28')).toBe(true)
  })

  it('o banco usa a mesma conta para o último dia do mês', () => {
    // Quem cria a tarefa é a função serie_cai_em do banco; o app só mostra "próxima: …". As duas precisam concordar.
    expect(regraDoBanco).toContain('extract(dow from p_dia)::smallint = any (p_dias)')
    expect(regraDoBanco).toContain("least(p_dia_mes::int, extract(day from (date_trunc('month', p_dia) + interval '1 month - 1 day'))::int)")
  })
})

describe('próximas ocorrências', () => {
  it('acha a próxima a partir de um dia, contando o próprio dia', () => {
    expect(proximaOcorrencia(diaria, '2026-11-11')).toBe('2026-11-11')
    expect(proximaOcorrencia(semanal(1), '2026-11-11')).toBe('2026-11-16')
    expect(proximaOcorrencia(semanal(3), '2026-11-11')).toBe('2026-11-11')
    expect(proximaOcorrencia(mensal(5), '2026-11-11')).toBe('2026-12-05')
    expect(proximaOcorrencia(mensal(31), '2026-12-31')).toBe('2026-12-31')
    expect(proximaOcorrencia(mensal(31), '2027-01-31')).toBe('2027-01-31')
  })

  it('não entra em laço com uma regra impossível', () => {
    expect(proximaOcorrencia(semanal(), '2026-11-11')).toBeNull()
  })

  it('lista as ocorrências de um intervalo (base do calendário)', () => {
    expect(ocorrenciasEntre(semanal(1, 3), '2026-11-09', '2026-11-18')).toEqual([
      '2026-11-09', '2026-11-11', '2026-11-16', '2026-11-18',
    ])
    expect(ocorrenciasEntre(mensal(31), '2027-01-01', '2027-03-31')).toEqual(['2027-01-31', '2027-02-28', '2027-03-31'])
    expect(ocorrenciasEntre(diaria, '2026-11-11', '2026-11-10')).toEqual([])
  })
})

describe('texto e validação da regra', () => {
  it('descreve a regra em português', () => {
    expect(descreverRegra(diaria)).toBe('Todo dia')
    expect(descreverRegra(semanal(1, 2, 3, 4, 5))).toBe('Dias úteis')
    expect(descreverRegra(semanal(6, 0))).toBe('Fins de semana')
    expect(descreverRegra(semanal(3, 1))).toBe('Toda seg, qua')
    expect(descreverRegra(mensal(5))).toBe('Todo dia 5 do mês')
  })

  it('recusa regra incompleta', () => {
    expect(validarRegra(diaria)).toBe('')
    expect(validarRegra(semanal(2))).toBe('')
    expect(validarRegra(semanal())).toMatch(/pelo menos um dia/)
    expect(validarRegra(mensal(0))).toMatch(/entre 1 e 31/)
    expect(validarRegra(mensal(32))).toMatch(/entre 1 e 31/)
    expect(validarRegra({ tipo: 'mensal', dias: null, dia_mes: null })).toMatch(/entre 1 e 31/)
  })

  it('guarda só os campos do tipo escolhido', () => {
    expect(limparRegra({ tipo: 'diaria', dias: [1], dia_mes: 5 })).toEqual({ tipo: 'diaria', dias: null, dia_mes: null })
    expect(limparRegra({ tipo: 'semanal', dias: [3, 1], dia_mes: 5 })).toEqual({ tipo: 'semanal', dias: [1, 3], dia_mes: null })
    expect(limparRegra({ tipo: 'mensal', dias: [1], dia_mes: 5 })).toEqual({ tipo: 'mensal', dias: null, dia_mes: 5 })
  })
})
