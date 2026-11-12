import { supabase } from './supabase'
import { checar, somarDias } from './tarefas'

export type Compromisso = {
  id: string
  titulo: string
  data: string // 'AAAA-MM-DD'
  hora: string | null // 'HH:MM:SS' (vazio = dia todo)
  hora_fim?: string | null // fim do bloco; menor que "hora" = termina no dia seguinte (existe depois do ciclo15)
  task_id?: string | null // tarefa que vai ser feita neste bloco (opcional)
  created_at: string
}

export type DadosCompromisso = Pick<Compromisso, 'titulo' | 'data' | 'hora' | 'hora_fim' | 'task_id'>

export const formatarHora = (h: string | null) => (h ? h.slice(0, 5) : 'Dia todo')

const minutos = (h: string) => {
  const [hh, mm] = h.split(':').map(Number)
  return hh * 60 + mm
}

// Duração do bloco em minutos. Fim antes do início = atravessa a meia-noite.
export function duracaoMinutos(hora: string | null | undefined, hora_fim: string | null | undefined) {
  if (!hora || !hora_fim) return null
  const d = minutos(hora_fim) - minutos(hora)
  return d > 0 ? d : d + 24 * 60
}

// "até 10:00" ou "até 07:00 do dia seguinte". Sem fim, não diz nada.
export function descreverFim(c: Pick<Compromisso, 'hora' | 'hora_fim'>) {
  if (!c.hora || !c.hora_fim) return null
  const virada = minutos(c.hora_fim) <= minutos(c.hora)
  return `até ${c.hora_fim.slice(0, 5)}${virada ? ' do dia seguinte' : ''}`
}

// Confere início e fim antes de salvar. '' = tudo certo.
export function validarHorario(hora: string, hora_fim: string) {
  if (hora_fim && !hora) return 'Para ter um fim, o compromisso precisa de um horário de início.'
  if (hora_fim && hora_fim.slice(0, 5) === hora.slice(0, 5)) return 'O fim precisa ser diferente do início.'
  return ''
}

// Ordena por data e depois por hora (os de "dia todo" primeiro).
export const ordemCompromisso = (a: Compromisso, b: Compromisso) =>
  a.data.localeCompare(b.data) || (a.hora ?? '').localeCompare(b.hora ?? '')

// Das duas últimas semanas em diante (o calendário deixa voltar algumas semanas).
export async function buscarCompromissos() {
  return checar<Compromisso[]>(await supabase.from('events').select('*').gte('data', somarDias(-14)))
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
