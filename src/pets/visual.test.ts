// Testes do visual: catálogo igual ao do banco e desbloqueio pelas memórias.
import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({ supabase: {} }))

import { ESPACOS, ITENS, desbloqueados, itensDo } from './visual'
import sqlDoVisual from '../../supabase/ciclo23-visual.sql?raw'

describe('visual do pet', () => {
  it('cada espaço tem 4 itens e nenhum id se repete', () => {
    for (const e of ESPACOS) expect(itensDo(e.id)).toHaveLength(4)
    expect(new Set(ITENS.map((i) => i.id)).size).toBe(ITENS.length)
  })

  it('o banco tem o mesmo catálogo: item, espaço e memória', () => {
    for (const i of ITENS) expect(sqlDoVisual).toContain(`('${i.id}', '${i.espaco}', '${i.memoria}')`)
  })

  it('desbloqueia pelos marcos do diário', () => {
    expect([...desbloqueados(['pet'])]).toEqual(['boina'])
    const varios = desbloqueados(['pet', 'primeira_tarefa', 'laco_2', 'nivel_5'])
    expect([...varios].sort()).toEqual(['boina', 'brilhos', 'coroa_folhas', 'estetoscopio'])
    expect(desbloqueados([]).size).toBe(0)
  })
})
