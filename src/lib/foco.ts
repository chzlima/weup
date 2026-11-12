import { supabase } from './supabase'
import { checar } from './tarefas'

// Sessões de foco. O banco marca o início e só aceita concluir depois que o tempo passou de verdade
// (ver supabase/ciclo7.sql); o app só mostra a contagem.

export type SessaoFoco = {
  id: string
  minutos: number // 5 a 120
  task_id: string | null
  inicio: string
  concluida_em: string | null
  pausada_em: string | null // vazio = rodando
  pausa_segundos: number // soma das pausas já encerradas
}

export const DURACOES: { id: '15' | '25' | '50' | 'outra'; nome: string }[] = [
  { id: '15', nome: '15 min' },
  { id: '25', nome: '25 min' },
  { id: '50', nome: '50 min' },
  { id: 'outra', nome: 'Outra' },
]

export const MIN_MINUTOS = 5
export const MAX_MINUTOS = 120
export const XP_FOCO = 10
// Sessões mais curtas que isso ficam registradas, mas não valem XP (evita juntar XP com sessões de 5 minutos).
export const MIN_MINUTOS_XP = 15
// Pausa curta oferecida depois de uma sessão (só no aparelho; não vai para o banco).
export const INTERVALO_MIN = 5

// Duração escolhida na tela: um número inteiro de 5 a 120, ou null se for inválida.
export function lerDuracao(texto: string) {
  const n = Number(texto)
  return Number.isInteger(n) && n >= MIN_MINUTOS && n <= MAX_MINUTOS ? n : null
}

// Quanto falta (ms), no horário "agora" do servidor. O tempo pausado não conta.
// Pausada: o restante fica congelado no momento da pausa.
export function tempoRestanteMs(s: Pick<SessaoFoco, 'minutos' | 'inicio' | 'pausada_em' | 'pausa_segundos'>, agora: number) {
  const ate = s.pausada_em ? Date.parse(s.pausada_em) : agora
  const decorrido = ate - Date.parse(s.inicio) - (s.pausa_segundos ?? 0) * 1000
  return Math.min(s.minutos * 60_000, Math.max(0, s.minutos * 60_000 - decorrido))
}

// Só retoma sessões recentes (de até 6 horas atrás); as mais antigas ficam esquecidas.
const JANELA_RETOMAR_MS = 6 * 60 * 60 * 1000

const CAMPOS = 'id, minutos, task_id, inicio, concluida_em, pausada_em, pausa_segundos'

export async function buscarFocoAtivo() {
  const desde = new Date(Date.now() - JANELA_RETOMAR_MS).toISOString()
  return checar<SessaoFoco | null>(
    await supabase
      .from('focus_sessions')
      .select(CAMPOS)
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
      .select(CAMPOS)
      .single(),
  )
}

// Pausar e continuar passam pelo banco: o tempo pausado fica registrado e não conta.
export async function pausarFoco(id: string) {
  checar(await supabase.rpc('pausar_foco', { p_id: id }))
}

export async function retomarFoco(id: string) {
  checar(await supabase.rpc('retomar_foco', { p_id: id }))
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
