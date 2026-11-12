// Testes da arte em camadas: os encaixes dos acessórios ficam dentro do quadro e acompanham o tamanho do pet.
import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({ supabase: {} }))
import { ESPECIES, ESTAGIOS } from '../lib/pets'
import { EXPRESSOES, encaixes } from './arte'

describe('arte dos pets', () => {
  it('tem as 6 expressões combinadas', () => {
    expect(EXPRESSOES.map((e) => e.id)).toEqual(['feliz', 'animado', 'curioso', 'tranquilo', 'orgulhoso', 'pensativo'])
  })

  it('os encaixes de chapéu e acessório ficam dentro do quadro em toda espécie e estágio', () => {
    for (const e of ESPECIES)
      for (const estagio of ESTAGIOS) {
        const { cabeca, lado } = encaixes(e.id, estagio)
        for (const p of [cabeca, lado]) {
          expect(p.x).toBeGreaterThanOrEqual(0)
          expect(p.x).toBeLessThanOrEqual(120)
          expect(p.y).toBeGreaterThanOrEqual(0)
          expect(p.y).toBeLessThanOrEqual(120)
        }
      }
  })

  it('pet menor, chapéu mais baixo', () => {
    expect(encaixes('gota', 1).cabeca.y).toBeGreaterThan(encaixes('gota', 3).cabeca.y)
  })
})
