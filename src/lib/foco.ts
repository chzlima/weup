import { supabase } from './supabase'
import { checar } from './tarefas'

// Sessões de foco. O banco marca o início e só aceita concluir depois que o tempo passou de verdade
// (ver supabase/ciclo7.sql); o app só mostra a contagem.

export type SessaoFoco = {
  id: string
  minutos: 15 | 25 | 50
  task_id: string | null
  inicio: string
  concluida_em: string | null
}

export const DURACOES: { id: '15' | '25' | '50'; nome: string }[] = [
  { id: '15', nome: '15 min' },
  { id: '25', nome: '25 min' },
  { id: '50', nome: '50 min' },
]

export const XP_FOCO = 10

// Só retoma sessões recentes (de até 6 horas atrás); as mais antigas ficam esquecidas.
const JANELA_RETOMAR_MS = 6 * 60 * 60 * 1000

export async function buscarFocoAtivo() {
  const desde = new Date(Date.now() - JANELA_RETOMAR_MS).toISOString()
  return checar<SessaoFoco | null>(
    await supabase
      .from('focus_sessions')
      .select('id, minutos, task_id, inicio, concluida_em')
      .is('concluida_em', null)
      .gte('inicio', desde)
      .order('inicio', { ascending: false })
      .limit(1)
      .maybeSingle(),
  )
}

export async function iniciarFoco(minutos: number, task_id: string | null) {
  return checar<SessaoFoco>(
    await supabase
      .from('focus_sessions')
      .insert({ minutos, task_id })
      .select('id, minutos, task_id, inicio, concluida_em')
      .single(),
  )
}

export async function desistirFoco(id: string) {
  checar(await supabase.from('focus_sessions').delete().eq('id', id))
}

// Devolve o XP ganho. Lança erro "ainda não terminou" se o relógio do celular estiver adiantado.
export async function concluirFoco(id: string) {
  const { data, error } = await supabase.rpc('concluir_foco', { p_id: id })
  if (error) throw new Error(error.message.includes('ainda não terminou') ? 'cedo' : error.message)
  return data as number
}
