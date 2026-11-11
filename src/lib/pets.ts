import { supabase } from './supabase'
import { checar } from './tarefas'

export type Especie = 'broto' | 'faisca' | 'gota'
export type Estagio = 1 | 2 | 3

export type MeuPet = { especie: Especie; nome: string; estagio: Estagio }

export const ESPECIES: { id: Especie; nome: string; descricao: string; estagios: [string, string, string] }[] = [
  { id: 'broto', nome: 'Broto', descricao: 'Calmo e paciente. Cresce devagar e firme.', estagios: ['Semente', 'Muda', 'Árvore'] },
  { id: 'faisca', nome: 'Faísca', descricao: 'Animada e corajosa. Adora um desafio.', estagios: ['Brasa', 'Chama', 'Fênix'] },
  { id: 'gota', nome: 'Gota', descricao: 'Tranquila e curiosa. Flui com a rotina.', estagios: ['Gotinha', 'Riacho', 'Nuvem'] },
]

export const especie = (id: Especie) => ESPECIES.find((e) => e.id === id)!

// O pet evolui junto com o nível do usuário (e nunca regride).
export const NIVEL_DO_ESTAGIO: Record<Estagio, number> = { 1: 1, 2: 5, 3: 10 }

export function estagioDoNivel(nivel: number): Estagio {
  if (nivel >= NIVEL_DO_ESTAGIO[3]) return 3
  if (nivel >= NIVEL_DO_ESTAGIO[2]) return 2
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
  return checar<MeuPet | null>(await supabase.from('user_pets').select('especie, nome, estagio').maybeSingle())
}

export async function salvarPet(dados: { especie: Especie; nome: string }) {
  return checar<MeuPet>(
    await supabase.from('user_pets').upsert(dados, { onConflict: 'user_id' }).select('especie, nome, estagio').single(),
  )
}

export async function subirEstagio(estagio: Estagio) {
  return checar<MeuPet>(
    await supabase.from('user_pets').update({ estagio }).not('user_id', 'is', null).select('especie, nome, estagio').single(),
  )
}

export async function renomearPet(nome: string) {
  return checar<MeuPet>(
    await supabase.from('user_pets').update({ nome }).not('user_id', 'is', null).select('especie, nome, estagio').single(),
  )
}
