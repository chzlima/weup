import { supabase } from './supabase'
import { checar, somarDias, type Categoria } from './tarefas'

export type Habito = {
  id: string
  titulo: string
  categoria: Categoria
  dias: number[] // 0 = domingo … 6 = sábado
  created_at: string
}

export type Registro = { id: string; habit_id: string; dia: string }

export type DadosHabito = Pick<Habito, 'titulo' | 'categoria' | 'dias'>

export const XP_HABITO = 10
export const TODOS_OS_DIAS = [0, 1, 2, 3, 4, 5, 6]
export const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] // letra de cada dia, começando no domingo
const NOMES_DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function descreverDias(dias: number[]) {
  const d = [...dias].sort()
  if (d.length === 7) return 'Todo dia'
  if (d.join() === '1,2,3,4,5') return 'Dias úteis'
  if (d.join() === '0,6') return 'Fins de semana'
  return d.map((i) => NOMES_DIAS[i]).join(', ')
}

// Busca só os registros recentes (os últimos 7 dias bastam para as telas atuais).
export const INICIO_HISTORICO = () => somarDias(-6)

export async function buscarHabitos() {
  const [h, r] = await Promise.all([
    supabase.from('habits').select('*').order('created_at'),
    supabase.from('habit_logs').select('id, habit_id, dia').gte('dia', INICIO_HISTORICO()),
  ])
  return { habitos: checar<Habito[]>(h), registros: checar<Registro[]>(r) }
}

export async function inserirHabito(dados: DadosHabito) {
  return checar<Habito>(await supabase.from('habits').insert(dados).select().single())
}

export async function editarHabito(id: string, dados: Partial<DadosHabito>) {
  return checar<Habito>(await supabase.from('habits').update(dados).eq('id', id).select().single())
}

export async function apagarHabito(id: string) {
  checar(await supabase.from('habits').delete().eq('id', id))
}

export async function marcarHabito(habit_id: string, dia: string) {
  return checar<Registro>(
    await supabase.from('habit_logs').upsert({ habit_id, dia }, { onConflict: 'habit_id,dia' }).select('id, habit_id, dia').single(),
  )
}

export async function desmarcarHabito(habit_id: string, dia: string) {
  checar(await supabase.from('habit_logs').delete().eq('habit_id', habit_id).eq('dia', dia))
}
