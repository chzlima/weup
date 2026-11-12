import type { Estagio } from '../lib/pets'

// Habitat do pet: a cena atrás dele. Muda com o estágio, com a hora do dia e com as conquistas do diário.
// Complementa o pet; não é um jogo de construção (as decorações aparecem sozinhas, por memórias).

export type Periodo = 'manha' | 'tarde' | 'noite'

export function periodoDoDia(hora: number): Periodo {
  if (hora >= 5 && hora < 12) return 'manha'
  if (hora >= 12 && hora < 18) return 'tarde'
  return 'noite'
}

// Três versões da cena: estágios 1–2, estágio 3 e estágios 4–5.
export const nivelDoHabitat = (estagio: Estagio): 1 | 2 | 3 => (estagio >= 4 ? 3 : estagio === 3 ? 2 : 1)

// Decorações que aparecem quando a memória existe (no máximo 4, sempre nos mesmos lugares).
export const DECORACOES = [
  { id: 'vaso', nome: 'Vaso de flor', memoria: 'primeira_habito' },
  { id: 'lanterna', nome: 'Lanterna', memoria: 'revisao_1' },
  { id: 'trofeu', nome: 'Troféu', memoria: 'xp_1000' },
  { id: 'almofada', nome: 'Almofada', memoria: 'laco_2' },
] as const

export type Decoracao = (typeof DECORACOES)[number]['id']

export function decoracoesDe(chavesDasMemorias: string[]): Decoracao[] {
  const tem = new Set(chavesDasMemorias)
  return DECORACOES.filter((d) => tem.has(d.memoria)).map((d) => d.id)
}
