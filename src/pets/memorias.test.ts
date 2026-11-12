// Testes do diário de memórias: textos, ordem e meses.
import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({ supabase: {} }))

import { agruparPorMes, ordenarMemorias, textoDaMemoria, type Memoria } from './memorias'
import sqlDasMemorias from '../../supabase/ciclo22-memorias.sql?raw'
import fundacao from '../../supabase/ciclo19-pet-fundacao.sql?raw'
import { xpTotalDoNivel } from '../lib/xp'

const m = (tipo: Memoria['tipo'], dia: string, valor: number | null = null, extra: string | null = null): Memoria => ({
  chave: `${tipo}-${dia}-${valor}-${extra}`, tipo, dia, valor, extra,
})
const pet = { especie: 'gota' as const, nome: 'Gota', caminho: null }

describe('diário de memórias', () => {
  it('escreve cada tipo de memória', () => {
    expect(textoDaMemoria(m('pet', '2026-11-11'), pet).titulo).toBe('Vocês se conheceram')
    expect(textoDaMemoria(m('primeira', '2026-11-11', null, 'tarefa'), pet).titulo).toBe('Primeira tarefa concluída')
    expect(textoDaMemoria(m('xp', '2026-11-11', 1000), pet).titulo).toBe('1.000 XP')
    expect(textoDaMemoria(m('nivel', '2026-11-11', 10), pet).texto).toMatch(/^Dedicado/)
    expect(textoDaMemoria(m('evolucao', '2026-11-11', 2), pet).titulo).toBe('Gota virou Riacho')
    expect(textoDaMemoria(m('evolucao', '2026-11-11', 4), { ...pet, caminho: 'saude' }).titulo).toBe('Gota virou Fonte Viva')
    expect(textoDaMemoria(m('recomeco', '2026-11-11'), pet).texto).toBe('Voltar também é coragem.')
    expect(textoDaMemoria(m('laco', '2026-11-11', 3), pet).titulo).toBe('Laço 3')
    expect(textoDaMemoria(m('caminho', '2026-11-11', null, 'organizacao'), pet).titulo).toBe('Caminho organização')
  })

  it('o mais recente vem primeiro, e no mesmo dia a evolução vem antes do primeiro passo', () => {
    const lista = ordenarMemorias([m('pet', '2026-11-10'), m('primeira', '2026-11-12', null, 'tarefa'), m('evolucao', '2026-11-12', 2)])
    expect(lista.map((x) => x.tipo)).toEqual(['evolucao', 'primeira', 'pet'])
  })

  it('agrupa por mês sem bagunçar a ordem', () => {
    const g = agruparPorMes([m('xp', '2026-12-02', 1000), m('pet', '2026-11-30'), m('primeira', '2026-11-11', null, 'foco')])
    expect(g.map((x) => [x.mes, x.itens.length])).toEqual([
      ['dezembro de 2026', 1],
      ['novembro de 2026', 2],
    ])
  })

  it('o banco usa a mesma curva de nível para datar níveis e evoluções', () => {
    expect(sqlDasMemorias).toContain('round((30 * power(n, 1.5) / 5)::numeric)::integer * 5')
    expect(fundacao).toContain('round((30 * power(n, 1.5) / 5)::numeric)::integer * 5')
    expect(xpTotalDoNivel(5)).toBe(510) // xp_ate_nivel(5) no banco
  })
})
