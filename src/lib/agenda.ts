import { supabase } from './supabase'
import { checar, hojeISO } from './tarefas'

export type Compromisso = {
  id: string
  titulo: string
  data: string // 'AAAA-MM-DD'
  hora: string | null // 'HH:MM:SS' (vazio = dia todo)
  created_at: string
}

export type DadosCompromisso = Pick<Compromisso, 'titulo' | 'data' | 'hora'>

export const formatarHora = (h: string | null) => (h ? h.slice(0, 5) : 'Dia todo')

// Ordena por data e depois por hora (os de "dia todo" primeiro).
export const ordemCompromisso = (a: Compromisso, b: Compromisso) =>
  a.data.localeCompare(b.data) || (a.hora ?? '').localeCompare(b.hora ?? '')

// Só interessa o que ainda vai acontecer (de hoje em diante).
export async function buscarCompromissos() {
  return checar<Compromisso[]>(await supabase.from('events').select('*').gte('data', hojeISO()))
}

export async function inserirCompromisso(dados: DadosCompromisso) {
  return checar<Compromisso>(await supabase.from('events').insert(dados).select().single())
}

export async function editarCompromisso(id: string, dados: DadosCompromisso) {
  return checar<Compromisso>(await supabase.from('events').update(dados).eq('id', id).select().single())
}

export async function apagarCompromisso(id: string) {
  checar(await supabase.from('events').delete().eq('id', id))
}
