// Testes da semana de plantão: só tarefas pequenas, até 3, e o texto do progresso.
import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { progressoDoPlantao, separarPlantao } from './plantao'
import type { Dificuldade, Tarefa } from './tarefas'

const t = (id: string, dificuldade: Dificuldade) => ({ id, dificuldade }) as Tarefa
const ids = (l: Tarefa[]) => l.map((x) => x.id)
const lista = [t('m1', 'media'), t('p1', 'pequena'), t('c1', 'complexa'), t('p2', 'pequena'), t('p3', 'pequena'), t('p4', 'pequena')]

describe('semana de plantão', () => {
  it('mostra só as pequenas, até completar 3, e guarda o resto', () => {
    expect(ids(separarPlantao(lista).visiveis)).toEqual(['p1', 'p2', 'p3'])
    expect(ids(separarPlantao(lista).guardadas)).toEqual(['m1', 'c1', 'p4'])
    expect(ids(separarPlantao(lista, 2).visiveis)).toEqual(['p1'])
    expect(separarPlantao(lista, 3).visiveis).toEqual([])
    expect(separarPlantao(lista, 3).guardadas).toHaveLength(6)
  })

  it('sem tarefa pequena, nada aparece e tudo fica guardado', () => {
    const grandes = [t('m1', 'media'), t('c1', 'complexa')]
    expect(separarPlantao(grandes).visiveis).toEqual([])
    expect(ids(separarPlantao(grandes).guardadas)).toEqual(['m1', 'c1'])
  })

  it('o progresso pede no máximo 3 e comemora sem cobrar', () => {
    expect(progressoDoPlantao(0, 5)).toEqual({ pct: 0, texto: '0 de 3 no plantão' })
    expect(progressoDoPlantao(1, 2)).toEqual({ pct: 50, texto: '1 de 2 no plantão' })
    expect(progressoDoPlantao(3, 5).texto).toBe('Plantão cumprido 🩺')
    expect(progressoDoPlantao(0, 0)).toEqual({ pct: 0, texto: 'Plantão: nada pendente' })
  })
})
