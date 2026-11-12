import type { Especie } from '../lib/pets'
import { hojeISO } from '../lib/tarefas'

// Brincar e Surpresa: interações de laço 4 e 5. Não dão XP nem pontos; são só momentos com o pet.

// O brinquedo de cada espécie (atravessa o palco enquanto o pet pula atrás).
export const BRINQUEDO: Record<Especie, string> = { broto: '🍃', faisca: '✨', gota: '🫧' }

// A surpresa é uma por dia, em cada aparelho (fica só no aparelho: é um detalhe, não um dado da conta).
const CHAVE = 'weup-surpresa-do-dia'

export function jaTeveSurpresaHoje(hoje = hojeISO()) {
  try {
    return localStorage.getItem(CHAVE) === hoje
  } catch {
    return false
  }
}

export function marcarSurpresaHoje(hoje = hojeISO()) {
  try {
    localStorage.setItem(CHAVE, hoje)
  } catch {
    /* sem armazenamento: a surpresa pode repetir, sem problema */
  }
}
