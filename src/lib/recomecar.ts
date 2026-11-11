import { supabase } from './supabase'
import { checar } from './tarefas'

export type Motivo = 'cansaco' | 'excesso' | 'motivacao' | 'outro'

// Passo 1: o que travou. Cada motivo tem um texto de acolhimento e sugestões de ação pequena.
export const MOTIVOS: { id: Motivo; nome: string; acolhimento: string; sugestoes: string[] }[] = [
  {
    id: 'cansaco',
    nome: 'Bateu cansaço',
    acolhimento: 'Cansaço é sinal de que você vem se esforçando. Vamos deixar o dia bem mais leve.',
    sugestoes: ['Beber um copo de água', 'Alongar o corpo por 2 minutos', 'Abrir a janela e respirar fundo 5 vezes'],
  },
  {
    id: 'excesso',
    nome: 'Tem coisa demais',
    acolhimento: 'Quando tudo parece urgente, nada anda. Vamos tirar peso da lista agora.',
    sugestoes: [
      'Escrever num papel as 3 coisas que mais pesam',
      'Organizar a mesa por 3 minutos',
      'Escolher UMA coisa para hoje e ignorar o resto',
    ],
  },
  {
    id: 'motivacao',
    nome: 'Sem vontade de começar',
    acolhimento: 'Motivação costuma vir depois do primeiro passo, não antes. Vamos fazer um bem pequeno.',
    sugestoes: ['Ler só 1 página do material', 'Abrir o material e olhar o sumário', 'Fazer só 5 minutos de estudo'],
  },
  {
    id: 'outro',
    nome: 'Não sei bem',
    acolhimento: 'Tudo bem não saber. Não precisa entender agora para recomeçar.',
    sugestoes: ['Respirar fundo 5 vezes', 'Arrumar a mesa por 3 minutos', 'Fazer a tarefa mais fácil da lista'],
  },
]

export async function registrarRecomeco(motivo: Motivo) {
  checar(await supabase.from('restarts').insert({ motivo }))
}

export async function contarRecomecos() {
  const { count, error } = await supabase.from('restarts').select('id', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return count ?? 0
}
