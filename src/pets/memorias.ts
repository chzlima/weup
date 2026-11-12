import { supabase } from '../lib/supabase'
import { checar } from '../lib/tarefas'
import type { Especie, Estagio } from '../lib/pets'
import { tituloDoNivel } from '../lib/xp'
import { caminho as dadosDoCaminho, nomeDaForma, type Caminho } from './caminhos'

// Diário de memórias: os marcos da jornada, criados pelo banco a partir do histórico (supabase/ciclo22-memorias.sql).
// Aqui só ficam os textos e a leitura.

export type Memoria = {
  chave: string
  tipo: 'pet' | 'primeira' | 'xp' | 'nivel' | 'evolucao' | 'revisao' | 'recomeco' | 'laco' | 'caminho'
  dia: string
  valor: number | null
  extra: string | null
}

const PRIMEIRAS: Record<string, { emoji: string; titulo: string; texto: string }> = {
  tarefa: { emoji: '✅', titulo: 'Primeira tarefa concluída', texto: 'O primeiro passo de muitos.' },
  habito: { emoji: '🌱', titulo: 'Primeiro hábito feito', texto: 'Uma rotina começa assim, pequenininha.' },
  foco: { emoji: '⏱️', titulo: 'Primeira sessão de foco', texto: 'Um tempo só seu, do começo ao fim.' },
  projeto: { emoji: '🏁', titulo: 'Primeiro projeto concluído', texto: 'Todas as etapas, uma por uma.' },
}

// Título e texto de cada memória. Nada de comparação nem cobrança: só o que aconteceu.
export function textoDaMemoria(m: Memoria, pet: { especie: Especie; nome: string; caminho: Caminho | null }) {
  switch (m.tipo) {
    case 'pet':
      return { emoji: '🥚', titulo: 'Vocês se conheceram', texto: `${pet.nome} entrou na sua jornada.` }
    case 'primeira':
      return PRIMEIRAS[m.extra ?? ''] ?? { emoji: '✨', titulo: 'Uma primeira vez', texto: 'Um começo que ficou guardado.' }
    case 'xp':
      return { emoji: '✨', titulo: `${(m.valor ?? 0).toLocaleString('pt-BR')} XP`, texto: 'Cada ponto veio de uma ação de verdade.' }
    case 'nivel':
      return { emoji: '⭐', titulo: `Nível ${m.valor}`, texto: `${tituloDoNivel(m.valor ?? 1)}. Você cresceu bastante até aqui.` }
    case 'evolucao':
      return {
        emoji: '🌟',
        titulo: `${pet.nome} virou ${nomeDaForma(pet.especie, (m.valor ?? 2) as Estagio, pet.caminho)}`,
        texto: 'Vocês cresceram juntos.',
      }
    case 'revisao':
      return { emoji: '📬', titulo: 'Primeira revisão da semana', texto: 'Parar para olhar o caminho também é avançar.' }
    case 'recomeco':
      return { emoji: '🔁', titulo: 'Primeiro recomeço', texto: 'Voltar também é coragem.' }
    case 'laco':
      return { emoji: '💛', titulo: `Laço ${m.valor}`, texto: `O laço com ${pet.nome} ficou mais forte.` }
    case 'caminho': {
      const c = m.extra ? dadosDoCaminho(m.extra as Caminho) : null
      return { emoji: '🧭', titulo: c ? `Caminho ${c.nome.toLowerCase()}` : 'Um caminho escolhido', texto: 'A escolha de para onde crescer.' }
    }
  }
}

// Ordem do diário: o mais recente primeiro; no mesmo dia, na ordem em que as coisas costumam acontecer.
const ORDEM: Memoria['tipo'][] = ['pet', 'primeira', 'recomeco', 'revisao', 'xp', 'nivel', 'evolucao', 'caminho', 'laco']

export function ordenarMemorias(lista: Memoria[]) {
  return [...lista].sort(
    (a, b) => b.dia.localeCompare(a.dia) || ORDEM.indexOf(b.tipo) - ORDEM.indexOf(a.tipo) || (b.valor ?? 0) - (a.valor ?? 0),
  )
}

// Agrupa por mês ("novembro de 2026"), mantendo a ordem.
export function agruparPorMes(lista: Memoria[]) {
  const grupos: { mes: string; itens: Memoria[] }[] = []
  for (const m of lista) {
    const [a, mm] = m.dia.split('-').map(Number)
    const mes = new Date(a, mm - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.mes === mes) ultimo.itens.push(m)
    else grupos.push({ mes, itens: [m] })
  }
  return grupos
}

// ---------- Banco ----------

const faltaOBanco = (e: { message: string; code?: string } | null) =>
  !!e && (e.code === '42883' || e.code === '42P01' || e.code === 'PGRST202' || e.code === 'PGRST205' || /could not find/i.test(e.message))

// Pede ao banco para registrar o que faltar e lê o diário. null = diário ainda não existe no banco.
export async function buscarMemorias(): Promise<Memoria[] | null> {
  const gerar = await supabase.rpc('registrar_memorias')
  if (faltaOBanco(gerar.error)) return null
  checar(gerar)
  return checar<Memoria[]>(await supabase.from('pet_memories').select('chave, tipo, dia, valor, extra'))
}
