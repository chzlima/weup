// Testes da explicação das regras de XP: quantas ações já valeram hoje e o texto do limite.
import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { estadoDaRegra, usadasNoDia, type Lancamento } from './xp'

const l = (tipo: Lancamento['tipo'], dia: string, limitado = false) => ({ tipo, dia, limitado }) as Lancamento

describe('regras de XP', () => {
  const lista = [l('habito', '2026-11-13'), l('habito', '2026-11-13'), l('habito', '2026-11-13', true), l('habito', '2026-11-12'), l('foco', '2026-11-13')]

  it('conta só as do dia e do tipo que valeram XP', () => {
    expect(usadasNoDia(lista, 'habito', '2026-11-13')).toBe(2)
    expect(usadasNoDia(lista, 'foco', '2026-11-13')).toBe(1)
    expect(usadasNoDia(lista, 'projeto', '2026-11-13')).toBe(0)
  })

  it('diz quanto já foi usado ou que o limite chegou', () => {
    expect(estadoDaRegra({ limite_dia: 10 }, 2)).toBe('2 de 10 hoje')
    expect(estadoDaRegra({ limite_dia: 2 }, 2)).toBe('limite de hoje atingido')
  })
})
