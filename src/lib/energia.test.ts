// Testes do check-in de energia: ordem da lista, dia leve e texto do progresso.
import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { META_DIA_LEVE, metaDoDia, ordenarPorEnergia, progressoDoDia, separarDiaLeve } from './energia'
import type { Dificuldade, Tarefa } from './tarefas'

const t = (id: string, dificuldade: Dificuldade) => ({ id, dificuldade }) as Tarefa
const ids = (l: Tarefa[]) => l.map((x) => x.id)
const lista = [t('m1', 'media'), t('c1', 'complexa'), t('p1', 'pequena'), t('m2', 'media'), t('p2', 'pequena')]

describe('check-in de energia', () => {
  it('energia baixa põe as menores primeiro; alta, as maiores; normal não mexe', () => {
    expect(ids(ordenarPorEnergia(lista, 'baixa'))).toEqual(['p1', 'p2', 'm1', 'm2', 'c1'])
    expect(ids(ordenarPorEnergia(lista, 'alta'))).toEqual(['c1', 'm1', 'm2', 'p1', 'p2'])
    expect(ids(ordenarPorEnergia(lista, 'normal'))).toEqual(ids(lista))
    expect(ids(ordenarPorEnergia(lista, null))).toEqual(ids(lista))
    expect(ids(lista)).toEqual(['m1', 'c1', 'p1', 'm2', 'p2']) // a lista original não é alterada
  })

  it('o dia leve mostra só o que falta para chegar a 3 e guarda o resto', () => {
    expect(META_DIA_LEVE).toBe(3)
    const ordenada = ordenarPorEnergia(lista, 'baixa')
    expect(ids(separarDiaLeve(ordenada, 'baixa', 0).visiveis)).toEqual(['p1', 'p2', 'm1'])
    expect(ids(separarDiaLeve(ordenada, 'baixa', 0).guardadas)).toEqual(['m2', 'c1'])
    expect(ids(separarDiaLeve(ordenada, 'baixa', 2).visiveis)).toEqual(['p1'])
    expect(separarDiaLeve(ordenada, 'baixa', 3).visiveis).toEqual([])
    expect(separarDiaLeve(ordenada, 'baixa', 5).guardadas).toHaveLength(5)
  })

  it('fora do dia leve, nada é guardado', () => {
    expect(separarDiaLeve(lista, 'normal', 0)).toEqual({ visiveis: lista, guardadas: [] })
    expect(separarDiaLeve(lista, 'alta', 4).visiveis).toHaveLength(5)
  })

  it('a meta do dia leve é 3, ou menos se o dia tiver menos coisas', () => {
    expect(metaDoDia(8, 'baixa')).toBe(3)
    expect(metaDoDia(2, 'baixa')).toBe(2)
    expect(metaDoDia(8, 'normal')).toBe(8)
    expect(metaDoDia(8, null)).toBe(8)
  })

  it('o progresso do dia leve conta só a meta e comemora quando chega lá', () => {
    expect(progressoDoDia(1, 8, 'baixa')).toEqual({ pct: 33, texto: '1 de 3 no dia leve' })
    expect(progressoDoDia(3, 8, 'baixa')).toEqual({ pct: 100, texto: 'Dia leve cumprido 🌱' })
    expect(progressoDoDia(5, 8, 'baixa')).toEqual({ pct: 100, texto: 'Dia leve cumprido 🌱' })
    expect(progressoDoDia(2, 8, 'normal')).toEqual({ pct: 25, texto: '2 de 8 concluídos' })
    expect(progressoDoDia(0, 0, 'baixa')).toEqual({ pct: 0, texto: 'Dia livre por enquanto' })
    expect(progressoDoDia(0, 0, null)).toEqual({ pct: 0, texto: 'Dia livre por enquanto' })
  })
})
