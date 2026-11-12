import { supabase } from './supabase'
import { checar } from './tarefas'

export type Especie = 'broto' | 'faisca' | 'gota'
export type Estagio = 1 | 2 | 3 | 4 | 5

export type MeuPet = {
  especie: Especie
  nome: string
  estagio: Estagio
  caminho: 'conhecimento' | 'saude' | 'organizacao' | null
  chapeu: string | null
  acessorio: string | null
  efeito: string | null
}

// Estágios 4 e 5: nomes provisórios até o ciclo dos caminhos (no estágio 4 a pessoa escolhe um caminho).
export const ESPECIES: { id: Especie; nome: string; descricao: string; estagios: [string, string, string, string, string] }[] = [
  {
    id: 'broto', nome: 'Broto', descricao: 'Calmo e paciente. Cresce devagar e firme.',
    estagios: ['Semente', 'Muda', 'Árvore', 'Bosque', 'Árvore Lendária'],
  },
  {
    id: 'faisca', nome: 'Faísca', descricao: 'Animada e corajosa. Adora um desafio.',
    estagios: ['Brasa', 'Chama', 'Fênix', 'Fênix Real', 'Fênix Lendária'],
  },
  {
    id: 'gota', nome: 'Gota', descricao: 'Tranquila e curiosa. Flui com a rotina.',
    estagios: ['Gotinha', 'Riacho', 'Nuvem', 'Tempestade', 'Céu Lendário'],
  },
]

export const ESTAGIOS: Estagio[] = [1, 2, 3, 4, 5]

export const especie = (id: Especie) => ESPECIES.find((e) => e.id === id)!

// O pet evolui junto com o nível do usuário (e nunca regride).
// Quem decide é o banco (função sincronizar_pet, supabase/ciclo19-pet-fundacao.sql); aqui é só para mostrar.
export const NIVEL_DO_ESTAGIO: Record<Estagio, number> = { 1: 1, 2: 5, 3: 10, 4: 15, 5: 25 }

export function estagioDoNivel(nivel: number): Estagio {
  for (const e of [5, 4, 3, 2] as Estagio[]) if (nivel >= NIVEL_DO_ESTAGIO[e]) return e
  return 1
}

// Frases de quando você toca no pet. Nada de cobrança: só incentivo.
export const FRASES = {
  semNada: [
    'Que tal começar com algo bem pequeno?',
    'Estou aqui com você. Um passo de cada vez.',
    'Descansar também faz parte da jornada.',
  ],
  andamento: [
    'Olha só, já começamos! Continua assim.',
    'Cada tarefa feita me deixa mais forte!',
    'Gosto do nosso ritmo de hoje.',
  ],
  completo: ['Dia completo! Que orgulho de você!', 'Fizemos tudo hoje! Hora de descansar também.'],
}

// ---------- Banco ----------

export async function buscarPet() {
  return checar<MeuPet | null>(await supabase.from('user_pets').select('especie, nome, estagio, caminho, chapeu, acessorio, efeito').maybeSingle())
}

export async function salvarPet(dados: { especie: Especie; nome: string }) {
  return checar<MeuPet>(
    await supabase.from('user_pets').upsert(dados, { onConflict: 'user_id' }).select('especie, nome, estagio, caminho, chapeu, acessorio, efeito').single(),
  )
}

// Pede ao banco para conferir o XP e subir o estágio, se for a hora. Devolve o estágio atual.
export async function sincronizarPet() {
  return checar<Estagio | null>(await supabase.rpc('sincronizar_pet'))
}

export async function renomearPet(nome: string) {
  return checar<MeuPet>(
    await supabase.from('user_pets').update({ nome }).not('user_id', 'is', null).select('especie, nome, estagio, caminho, chapeu, acessorio, efeito').single(),
  )
}
