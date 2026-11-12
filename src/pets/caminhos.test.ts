// Testes dos caminhos de evolução: nomes das formas e a sugestão.
import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({ supabase: {} }))

import { CAMINHOS, FORMAS, caminhoSugerido, nomeDaForma } from './caminhos'
import sqlDosCaminhos from '../../supabase/ciclo21-caminhos.sql?raw'

describe('caminhos', () => {
  it('cada espécie tem 3 caminhos, cada um com forma do estágio 4 e lendária, sem nome repetido', () => {
    const nomes = Object.values(FORMAS).flatMap((c) => Object.values(c).flat())
    expect(nomes).toHaveLength(18)
    expect(new Set(nomes).size).toBe(18)
  })

  it('o nome da forma segue o caminho só a partir do estágio 4', () => {
    expect(nomeDaForma('broto', 3, 'saude')).toBe('Árvore')
    expect(nomeDaForma('broto', 4, null)).toBe('Bosque')
    expect(nomeDaForma('broto', 4, 'organizacao')).toBe('Bonsai')
    expect(nomeDaForma('gota', 5, 'conhecimento')).toBe('Céu Infinito')
  })

  it('sugere o atributo com mais XP', () => {
    expect(caminhoSugerido({ conhecimento: 100, saude: 300, organizacao: 50 })).toBe('saude')
    expect(caminhoSugerido({ conhecimento: 10, saude: 10, organizacao: 90 })).toBe('organizacao')
    expect(caminhoSugerido({ conhecimento: 0, saude: 0, organizacao: 0 })).toBe('conhecimento')
  })

  it('o banco aceita exatamente os mesmos caminhos', () => {
    for (const c of CAMINHOS) expect(sqlDosCaminhos).toContain(`'${c.id}'`)
  })
})
