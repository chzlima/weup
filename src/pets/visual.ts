import { supabase } from '../lib/supabase'
import { checar } from '../lib/tarefas'

// Visual do pet: chapéu, acessório e efeito. Cada item se desbloqueia por uma memória do diário.
// Sem loja, sem moeda e sem vantagem de produtividade. O banco confere (supabase/ciclo23-visual.sql).

export type Espaco = 'chapeu' | 'acessorio' | 'efeito'
export type Visual = { chapeu: string | null; acessorio: string | null; efeito: string | null }

export const ESPACOS: { id: Espaco; nome: string }[] = [
  { id: 'chapeu', nome: 'Chapéu' },
  { id: 'acessorio', nome: 'Acessório' },
  { id: 'efeito', nome: 'Efeito' },
]

// Mesma lista da função item_do_pet do banco (há teste de paridade).
export const ITENS: { id: string; espaco: Espaco; nome: string; memoria: string; dica: string }[] = [
  { id: 'boina', espaco: 'chapeu', nome: 'Boina', memoria: 'pet', dica: 'Já é sua' },
  { id: 'coroa_folhas', espaco: 'chapeu', nome: 'Coroa de folhas', memoria: 'laco_2', dica: 'Laço 2' },
  { id: 'capelo', espaco: 'chapeu', nome: 'Capelo', memoria: 'nivel_10', dica: 'Nível 10' },
  { id: 'coroa', espaco: 'chapeu', nome: 'Coroa', memoria: 'evolucao_4', dica: 'Estágio 4' },
  { id: 'estetoscopio', espaco: 'acessorio', nome: 'Estetoscópio', memoria: 'primeira_tarefa', dica: 'Primeira tarefa' },
  { id: 'flor', espaco: 'acessorio', nome: 'Flor', memoria: 'primeira_habito', dica: 'Primeiro hábito' },
  { id: 'laco_fita', espaco: 'acessorio', nome: 'Laço de fita', memoria: 'laco_3', dica: 'Laço 3' },
  { id: 'medalha', espaco: 'acessorio', nome: 'Medalha', memoria: 'xp_1000', dica: '1.000 XP' },
  { id: 'brilhos', espaco: 'efeito', nome: 'Brilhos', memoria: 'nivel_5', dica: 'Nível 5' },
  { id: 'vagalumes', espaco: 'efeito', nome: 'Vaga-lumes', memoria: 'revisao_1', dica: 'Primeira revisão' },
  { id: 'estrelas', espaco: 'efeito', nome: 'Estrelas', memoria: 'recomeco_1', dica: 'Primeiro recomeço' },
  { id: 'coracoes', espaco: 'efeito', nome: 'Corações', memoria: 'laco_4', dica: 'Laço 4' },
]

export const itensDo = (e: Espaco) => ITENS.filter((i) => i.espaco === e)

// Quais itens estão desbloqueados, a partir das chaves das memórias.
export function desbloqueados(chavesDasMemorias: string[]) {
  const tem = new Set(chavesDasMemorias)
  return new Set(ITENS.filter((i) => tem.has(i.memoria)).map((i) => i.id))
}

// Grava o que o pet está usando. O banco recusa item bloqueado ou no espaço errado.
export async function salvarVisual(v: Visual) {
  return checar<Visual>(
    await supabase.from('user_pets').update(v).not('user_id', 'is', null).select('chapeu, acessorio, efeito').single(),
  )
}
